import { NextRequest } from "next/server";
import { requireHospitalAdmin } from "../../../../../backend/middlewares/role.middleware";
import { successResponse, errorResponse } from "../../../../../backend/utils/response";
import { updateBlogSchema } from "../../../../../backend/validations/blog.validation";
import * as blogService from "../../../../../backend/services/blog.service";
import { withApiRoute } from "../../../../../backend/utils/api-route";

// GET /api/blogs/[id]
export const GET = withApiRoute("blogs.id.get", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;

  try {
    // Try public slug lookup first
    const { searchParams } = new URL(req.url);
    if (searchParams.get("public") === "true") {
      const blog = await blogService.getPublicBlogBySlug(id);
      if (!blog) return errorResponse("Blog not found", 404);
      return successResponse(blog);
    }

    // Admin lookup
    const auth = await requireHospitalAdmin(req);
    if (auth.error) return auth.error;

    const blog = await blogService.getBlogById(id, auth.hospitalId);
    if (!blog) return errorResponse("Blog not found", 404);
    return successResponse(blog);
  } catch (e: any) {
    return errorResponse(e.message || "Failed to fetch blog", 500);
  }
});

// PUT /api/blogs/[id]
export const PUT = withApiRoute("blogs.id.put", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const parsed = updateBlogSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("Validation error", 400, parsed.error.flatten().fieldErrors);
    }

    const blog = await blogService.updateBlog(id, auth.hospitalId, parsed.data);
    if (!blog) return errorResponse("Blog not found", 404);
    return successResponse(blog, "Blog updated successfully");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to update blog", 500);
  }
});

// DELETE /api/blogs/[id]
export const DELETE = withApiRoute("blogs.id.delete", async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const auth = await requireHospitalAdmin(req);
  if (auth.error) return auth.error;

  try {
    const blog = await blogService.deleteBlog(id, auth.hospitalId);
    if (!blog) return errorResponse("Blog not found", 404);
    return successResponse(null, "Blog deleted successfully");
  } catch (e: any) {
    return errorResponse(e.message || "Failed to delete blog", 500);
  }
});
