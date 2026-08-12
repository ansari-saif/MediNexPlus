import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

/** Parent departments created for ops sub-modules. */
export const DEFAULT_ONBOARD_PARENT_DEPARTMENTS = [
  { name: "Clinical Services", code: "CLIN", type: "CLINICAL" as const },
  { name: "Administrative", code: "ADMIN", type: "ADMINISTRATIVE" as const },
  { name: "Support Services", code: "SUPP", type: "SUPPORT" as const },
  { name: "Diagnostics", code: "DIAG", type: "DIAGNOSTIC" as const },
] as const;

/**
 * Default Sub Departments for a new hospital (ops modules used in Hospital Admin sidebar).
 * OPD/IPD/Reception/Billing are covered by top-level admin nav, so they are not seeded here.
 */
export const DEFAULT_ONBOARD_SUB_DEPARTMENTS = [
  { name: "Pharmacy", type: "PHARMACY" as const, parentType: "SUPPORT" as const },
  { name: "Ambulance", type: "AMBULANCE" as const, parentType: "SUPPORT" as const },
  { name: "Housekeeping", type: "HOUSEKEEPING" as const, parentType: "SUPPORT" as const },
  { name: "Pathology Lab", type: "PATHOLOGY" as const, parentType: "DIAGNOSTIC" as const },
  { name: "Blood Bank", type: "BLOOD_BANK" as const, parentType: "DIAGNOSTIC" as const },
] as const;

/**
 * Seed parent departments + default ops sub-departments for a newly created hospital.
 * Idempotent: skips types/codes that already exist.
 */
export async function seedHospitalDefaults(db: Db, hospitalId: string) {
  const existingParents = await db.department.findMany({
    where: { hospitalId },
    select: { id: true, type: true, code: true },
  });
  const parentByType = new Map(existingParents.map((d) => [d.type, d.id]));
  const parentCodes = new Set(existingParents.map((d) => d.code));

  for (const parent of DEFAULT_ONBOARD_PARENT_DEPARTMENTS) {
    if (parentByType.has(parent.type) || parentCodes.has(parent.code)) continue;
    const created = await db.department.create({
      data: {
        hospitalId,
        name: parent.name,
        code: parent.code,
        type: parent.type,
        allowAppointments: false,
        isIPD: false,
        isActive: true,
      },
    });
    parentByType.set(parent.type, created.id);
    parentCodes.add(parent.code);
  }

  const existingSubs = await db.subDepartment.findMany({
    where: { hospitalId },
    select: { type: true },
  });
  const haveTypes = new Set(existingSubs.map((s) => s.type));

  const createdSubTypes: string[] = [];
  for (const sub of DEFAULT_ONBOARD_SUB_DEPARTMENTS) {
    if (haveTypes.has(sub.type)) continue;
    await db.subDepartment.create({
      data: {
        hospitalId,
        name: sub.name,
        type: sub.type,
        departmentId: parentByType.get(sub.parentType) ?? null,
        isActive: true,
        color: "#0E898F",
      },
    });
    haveTypes.add(sub.type);
    createdSubTypes.push(sub.type);
  }

  return {
    parents: [...parentByType.keys()],
    subDepartments: [...haveTypes],
    createdSubTypes,
  };
}
