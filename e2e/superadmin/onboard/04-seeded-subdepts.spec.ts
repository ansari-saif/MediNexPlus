import { test, expect } from "./fixtures";

test.describe.configure({ mode: "serial" });

const EXPECTED_TYPES = [
  "PHARMACY",
  "AMBULANCE",
  "HOUSEKEEPING",
  "PATHOLOGY",
  "BLOOD_BANK",
] as const;

test.describe("superadmin onboard · seeded sub-departments", () => {
  test("new hospital is seeded with default ops sub-departments", async ({
    hospitalAdminLogin,
    createdHospital,
    page,
    ui,
  }) => {
    await hospitalAdminLogin.login(createdHospital.adminEmail, createdHospital.adminPassword);

    const res = await page.request.get("/api/config/subdepartments?isActive=true&limit=100");
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.success).toBe(true);
    const rows = body.data?.data ?? body.data ?? [];
    const types = new Set((rows as { type?: string }[]).map((r) => r.type));

    for (const t of EXPECTED_TYPES) {
      expect(types.has(t), `missing seeded sub-dept type ${t}`).toBe(true);
    }

    await ui("hospitaladmin.nav.subdepartments").click();
    await expect(ui("hospitaladmin.nav.subdepartments.menu")).toBeVisible();
    await expect(page.getByText("Pharmacy", { exact: true })).toBeVisible();
    await expect(page.getByText("Pathology Lab", { exact: true })).toBeVisible();
  });
});
