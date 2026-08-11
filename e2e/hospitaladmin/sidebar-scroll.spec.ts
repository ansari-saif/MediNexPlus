import { test, expect } from "../fixtures";

const email = process.env.E2E_HOSPITAL_EMAIL || "admin@hospital.com";
const password = process.env.E2E_HOSPITAL_PASSWORD || "Medinex@123";

test.describe("hospital admin sidebar scroll", () => {
  test("nav scrolls when Sub Departments submenu overflows", async ({ page, ui }) => {
    await page.route("**/api/config/subdepartments?**", async (route) => {
      if (route.request().method() !== "GET") return route.continue();
      const items = Array.from({ length: 14 }, (_, i) => ({
        id: `sub-${i}`,
        name: `Module ${i + 1}`,
        type: "OTHER",
        customName: `Module ${i + 1}`,
        isActive: true,
        departmentId: "dept-1",
      }));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { data: items, pagination: { page: 1, limit: 100, total: items.length, totalPages: 1 } },
        }),
      });
    });

    await page.goto("/login");
    await ui("auth.login.email").fill(email);
    await ui("auth.login.password").fill(password);
    await ui("auth.login.submit").click();
    await page.waitForURL("**/hospitaladmin/**", { timeout: 20_000 });

    await expect(ui("hospitaladmin.nav.subdepartments")).toBeVisible({ timeout: 15_000 });
    await ui("hospitaladmin.nav.subdepartments").click();
    await expect(ui("hospitaladmin.nav.subdepartments.menu")).toBeVisible();

    const nav = page.locator(".hd-nav");
    const scroll = await nav.evaluate((el) => {
      const before = el.scrollTop;
      el.scrollTop = 400;
      return {
        canOverflow: el.scrollHeight > el.clientHeight + 20,
        moved: el.scrollTop > before,
        overflowY: getComputedStyle(el).overflowY,
        minHeight: getComputedStyle(el).minHeight,
      };
    });

    expect(scroll.canOverflow, "sidebar nav should overflow with expanded submenu").toBe(true);
    expect(scroll.overflowY).toMatch(/auto|scroll/);
    expect(scroll.moved, "sidebar nav should accept scrollTop").toBe(true);
  });
});
