import { NextRequest } from "next/server";
import { requireRole } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { Role } from "@prisma/client";
import prisma from "../../../../../backend/config/db";
import { getLocationStockForDept } from "../../../../../backend/repositories/central-inventory.repo";
import { withApiRoute } from "../../../../../backend/utils/api-route";

const px = prisma as any;

async function resolvePreferredVendorId(
  hospitalId: string,
  supplierName?: string | null
): Promise<string | null> {
  if (!supplierName) return null;
  const supplier = await px.supplier.findFirst({
    where: { hospitalId, name: supplierName, isActive: true },
    select: { id: true },
  });
  return supplier?.id || null;
}

function withSupplierName(item: any, vendorsById: Map<string, string>) {
  return {
    ...item,
    supplierName: item.preferredVendorId
      ? vendorsById.get(item.preferredVendorId) || null
      : null,
  };
}

async function loadVendorNameMap(hospitalId: string, vendorIds: string[]) {
  const uniqueIds = [...new Set(vendorIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map<string, string>();

  const vendors = await px.supplier.findMany({
    where: { hospitalId, id: { in: uniqueIds } },
    select: { id: true, name: true },
  });
  return new Map(vendors.map((v: any) => [v.id, v.name]));
}

/**
 * GET /api/pharmacy/inventory
 * List inventory items — SUB_DEPT_HEAD, HOSPITAL_ADMIN
 */
export const GET = withApiRoute("pharmacy.inventory.get", async (req: NextRequest) => {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN, Role.STAFF]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "200");

    if (auth.user.role === Role.SUB_DEPT_HEAD) {
      const subDept = await px.subDepartment.findFirst({
        where: { userId: auth.user.userId, hospitalId: auth.hospitalId },
        select: { id: true },
      });

      if (!subDept) return successResponse([], "Items fetched");

      const locationStock = await getLocationStockForDept(auth.hospitalId, subDept.id);

      const completedPurchases = await px.purchase.findMany({
        where: {
          hospitalId: auth.hospitalId,
          subDepartmentId: subDept.id,
          status: "COMPLETED",
        },
        include: {
          items: {
            include: {
              item: {
                select: {
                  id: true, name: true, genericName: true, category: true,
                  unit: true, purchasePrice: true, mrp: true, sellingPrice: true,
                  minStock: true, isActive: true,
                },
              },
            },
          },
        },
      });

      const merged: Record<string, any> = {};

      for (const item of locationStock.items) {
        merged[item.itemId] = {
          id: item.itemId,
          name: item.name,
          genericName: item.genericName || "",
          category: item.category,
          unit: item.unit,
          purchasePrice: item.purchasePrice,
          mrp: item.mrp,
          sellingPrice: item.sellingPrice,
          minStock: item.minStock,
          isActive: true,
          totalStock: item.availableQty,
        };
      }

      for (const purchase of completedPurchases) {
        for (const purchaseItem of purchase.items) {
          if (!purchaseItem.item) continue;
          if (!merged[purchaseItem.itemId]) {
            merged[purchaseItem.itemId] = {
              id: purchaseItem.itemId,
              name: purchaseItem.item.name,
              genericName: purchaseItem.item.genericName || "",
              category: purchaseItem.item.category,
              unit: purchaseItem.item.unit,
              purchasePrice: purchaseItem.item.purchasePrice,
              mrp: purchaseItem.item.mrp,
              sellingPrice: purchaseItem.item.sellingPrice,
              minStock: purchaseItem.item.minStock,
              isActive: purchaseItem.item.isActive,
              totalStock: 0,
            };
          }
          merged[purchaseItem.itemId].totalStock += purchaseItem.quantity;
        }
      }

      // Use actual StockBatch.remainingQty as single source of truth for totalStock
      const itemIds = Object.keys(merged);
      if (itemIds.length > 0) {
        const batches = await px.stockBatch.findMany({
          where: { hospitalId: auth.hospitalId, itemId: { in: itemIds }, remainingQty: { gt: 0 } },
          select: { itemId: true, remainingQty: true },
        });
        for (const key of itemIds) {
          merged[key].totalStock = 0;
        }
        for (const b of batches) {
          if (merged[b.itemId]) {
            merged[b.itemId].totalStock += b.remainingQty;
          }
        }
      }

      const result = Object.values(merged)
        .filter((item: any) => item.isActive && (!search || item.name?.toLowerCase().includes(search.toLowerCase()) || item.genericName?.toLowerCase().includes(search.toLowerCase()) || item.category?.toLowerCase().includes(search.toLowerCase())))
        .sort((a: any, b: any) => String(a.name || "").localeCompare(String(b.name || "")))
        .slice(0, limit);

      return successResponse(result, "Items fetched");
    }

    const where: any = { hospitalId: auth.hospitalId, isActive: true };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { genericName: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const items = await px.inventoryItem.findMany({
      where,
      select: {
        id: true, name: true, genericName: true, category: true,
        unit: true, purchasePrice: true, mrp: true, sellingPrice: true,
        minStock: true, isActive: true, preferredVendorId: true,
        batches: { select: { remainingQty: true } },
      },
      orderBy: { name: "asc" },
      take: limit,
    });

    const vendorsById = await loadVendorNameMap(
      auth.hospitalId,
      items.map((i: any) => i.preferredVendorId)
    );

    const result = items.map((i: any) =>
      withSupplierName(
        {
          ...i,
          totalStock: i.batches.reduce((s: number, b: any) => s + b.remainingQty, 0),
          batches: undefined,
        },
        vendorsById
      )
    );

    return successResponse(result, "Items fetched");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch items", 500);
  }
});

/**
 * POST /api/pharmacy/inventory
 * Create a new inventory item — SUB_DEPT_HEAD or HOSPITAL_ADMIN
 */
export const POST = withApiRoute("pharmacy.inventory.post", async (req: NextRequest) => {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const {
      name, category, unit, purchasePrice, mrp, sellingPrice, gst, minStock, openingStock,
      genericName, brandName, subCategory, description, hsnCode, barcode, supplierName,
      isActive,
    } = body;

    if (!name || !category) return errorResponse("name and category are required", 400);

    const preferredVendorId = await resolvePreferredVendorId(auth.hospitalId, supplierName);

    const item = await px.inventoryItem.create({
      data: {
        hospitalId: auth.hospitalId,
        name,
        category: category || "Medicine",
        unit: unit || "pcs",
        purchasePrice: purchasePrice || 0,
        mrp: mrp || purchasePrice || 0,
        sellingPrice: sellingPrice || purchasePrice || 0,
        gst: gst || 0,
        minStock: minStock ?? 5,
        isActive: isActive !== undefined ? isActive : true,
        genericName: genericName || null,
        brandName: brandName || null,
        subCategory: subCategory || null,
        description: description || null,
        hsnCode: hsnCode || null,
        barcode: barcode || null,
        preferredVendorId,
      },
    });

    // Create opening stock batch if provided
    if (openingStock && openingStock > 0) {
      const batch = await px.stockBatch.create({
        data: {
          hospitalId: auth.hospitalId,
          itemId: item.id,
          batchNumber: "OPENING",
          quantity: openingStock,
          remainingQty: openingStock,
          purchasePrice: purchasePrice || 0,
          sellingPrice: sellingPrice || purchasePrice || 0,
        },
      });
      await px.stockMovement.create({
        data: {
          hospitalId: auth.hospitalId,
          itemId: item.id,
          batchId: batch.id,
          type: "IN",
          quantity: openingStock,
          source: "OpeningStock",
          notes: `Opening stock for ${name}`,
          performedBy: auth.user.userId,
        },
      });
    }

    return successResponse(item, "Item created", 201);
  } catch (error: any) {
    if (error.code === "P2002") return errorResponse("Item with same name & category already exists", 409);
    return errorResponse(error.message || "Failed to create item", 500);
  }
});

/**
 * PUT /api/pharmacy/inventory
 * Update an existing inventory item — SUB_DEPT_HEAD or HOSPITAL_ADMIN
 * Body: { id, ...fields }
 */
export const PUT = withApiRoute("pharmacy.inventory.put", async (req: NextRequest) => {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN]);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const { id, name, category, unit, purchasePrice, mrp, sellingPrice, gst, minStock,
      genericName, brandName, subCategory, description, hsnCode, barcode, supplierName, isActive } = body;

    if (!id) return errorResponse("id is required", 400);

    const existing = await px.inventoryItem.findFirst({ where: { id, hospitalId: auth.hospitalId } });
    if (!existing) return errorResponse("Item not found", 404);

    let preferredVendorId: string | null | undefined;
    if (supplierName !== undefined) {
      preferredVendorId = await resolvePreferredVendorId(auth.hospitalId, supplierName);
    }

    const updated = await px.inventoryItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(unit !== undefined && { unit }),
        ...(purchasePrice !== undefined && { purchasePrice }),
        ...(mrp !== undefined && { mrp }),
        ...(sellingPrice !== undefined && { sellingPrice }),
        ...(gst !== undefined && { gst }),
        ...(minStock !== undefined && { minStock }),
        ...(genericName !== undefined && { genericName: genericName || null }),
        ...(brandName !== undefined && { brandName: brandName || null }),
        ...(subCategory !== undefined && { subCategory: subCategory || null }),
        ...(description !== undefined && { description: description || null }),
        ...(hsnCode !== undefined && { hsnCode: hsnCode || null }),
        ...(barcode !== undefined && { barcode: barcode || null }),
        ...(preferredVendorId !== undefined && { preferredVendorId }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return successResponse(updated, "Item updated");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to update item", 500);
  }
});

/**
 * DELETE /api/pharmacy/inventory?id=
 * Soft-delete an inventory item — SUB_DEPT_HEAD or HOSPITAL_ADMIN
 */
export const DELETE = withApiRoute("pharmacy.inventory.delete", async (req: NextRequest) => {
  const auth = await requireRole(req, [Role.SUB_DEPT_HEAD, Role.HOSPITAL_ADMIN]);
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return errorResponse("id is required", 400);

    const existing = await px.inventoryItem.findFirst({ where: { id, hospitalId: auth.hospitalId } });
    if (!existing) return errorResponse("Item not found", 404);

    await px.inventoryItem.update({ where: { id }, data: { isActive: false } });

    return successResponse(null, "Item deleted");
  } catch (error: any) {
    return errorResponse(error.message || "Failed to delete item", 500);
  }
});
