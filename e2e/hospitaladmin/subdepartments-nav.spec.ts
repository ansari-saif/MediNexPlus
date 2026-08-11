import { test, expect } from "../fixtures";

const email = process.env.E2E_HOSPITAL_EMAIL || "admin@hospital.com";
const password = process.env.E2E_HOSPITAL_PASSWORD || "Medinex@123";

const MOCK_SUBDEPTS = {
  success: true,
  data: {
    data: [
      { id: "sub-pharmacy-1", name: "Pharmacy Store", type: "PHARMACY", customName: null, isActive: true, departmentId: "dept-1" },
      { id: "sub-pathology-1", name: "Main Lab", type: "PATHOLOGY", customName: "Pathology Lab", isActive: true, departmentId: "dept-2" },
    ],
    pagination: { page: 1, limit: 100, total: 2, totalPages: 1 },
  },
};

test.describe("hospital admin sub-departments nav", () => {
  test("expandable Sub Departments menu lists modules and opens host page", async ({ page, ui }) => {
    await page.route("**/api/config/subdepartments?**", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(MOCK_SUBDEPTS),
      });
    });

    await page.route("**/api/config/subdepartments/sub-pharmacy-1", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            id: "sub-pharmacy-1",
            name: "Pharmacy Store",
            type: "PHARMACY",
            customName: null,
            isActive: true,
            departmentId: "dept-1",
          },
        }),
      });
    });

    // Keep pharmacy child APIs from hanging the host page
    await page.route("**/api/pharmacy/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: {} }),
      });
    });

    await page.goto("/login");
    await ui("auth.login.email").fill(email);
    await ui("auth.login.password").fill(password);
    await ui("auth.login.submit").click();

    await page.waitForURL("**/hospitaladmin/**", { timeout: 20_000 });

    await expect(ui("hospitaladmin.nav.subdepartments")).toBeVisible({ timeout: 15_000 });
    await ui("hospitaladmin.nav.subdepartments").click();

    await expect(ui("hospitaladmin.nav.subdepartments.menu")).toBeVisible({ timeout: 5_000 });
    await expect(
      page.locator('[data-ui="hospitaladmin.nav.subdept-item"][data-ui-instance="sub-pharmacy-1"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-ui="hospitaladmin.nav.subdept-item"][data-ui-instance="sub-pathology-1"]')
    ).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/hospitaladmin\/sub-departments\/sub-pharmacy-1\/?$/, { timeout: 15_000 }),
      page.locator('[data-ui="hospitaladmin.nav.subdept-item"][data-ui-instance="sub-pharmacy-1"]').click(),
    ]);

    // Soft nav can race while the new segment compiles; full load is definitive.
    if (!(await ui("hospitaladmin.subdept").isVisible().catch(() => false))) {
      await page.goto("/hospitaladmin/sub-departments/sub-pharmacy-1");
    }

    await expect(ui("hospitaladmin.subdept")).toBeVisible({ timeout: 15_000 });
  });
});
