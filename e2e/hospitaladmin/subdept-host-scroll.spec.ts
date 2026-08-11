import { test, expect } from "../fixtures";

const email = process.env.E2E_HOSPITAL_EMAIL || "admin@hospital.com";
const password = process.env.E2E_HOSPITAL_PASSWORD || "Medinex@123";

test.describe("hospital admin subdept host scroll", () => {
  test("sub-department host page scrolls when module content overflows", async ({ page, ui }) => {
    let pharmacyId = "";

    await page.goto("/login");
    await ui("auth.login.email").fill(email);
    await ui("auth.login.password").fill(password);
    await ui("auth.login.submit").click();
    await page.waitForURL("**/hospitaladmin/**", { timeout: 20_000 });

    const list = await page.evaluate(async () => {
      const r = await fetch("/api/config/subdepartments?isActive=true&limit=100", { credentials: "include" });
      return r.json();
    });
    const rows = list?.data?.data || list?.data || [];
    pharmacyId = rows.find((r: any) => r.type === "PHARMACY")?.id;
    expect(pharmacyId, "Pharmacy sub-department should exist").toBeTruthy();

    await page.route("**/api/pharmacy/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: {} }),
      });
    });

    await page.goto(`/hospitaladmin/sub-departments/${pharmacyId}`);
    await expect(ui("hospitaladmin.subdept")).toBeVisible({ timeout: 20_000 });

    // Make content tall if the module is still loading lightly
    await ui("hospitaladmin.subdept").evaluate((el) => {
      const spacer = document.createElement("div");
      spacer.setAttribute("data-scroll-probe", "1");
      spacer.style.height = "2000px";
      el.appendChild(spacer);
    });

    const scroll = await ui("hospitaladmin.subdept").evaluate((el) => {
      const before = el.scrollTop;
      el.scrollTop = 500;
      return {
        canOverflow: el.scrollHeight > el.clientHeight + 20,
        moved: el.scrollTop > before,
        overflowY: getComputedStyle(el).overflowY,
        clientHeight: el.clientHeight,
        scrollHeight: el.scrollHeight,
      };
    });

    expect(scroll.canOverflow, "host page should overflow viewport").toBe(true);
    expect(scroll.overflowY).toMatch(/auto|scroll/);
    expect(scroll.moved, "host page should accept scrollTop").toBe(true);
  });
});
