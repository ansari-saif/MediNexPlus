import { test, expect } from "../fixtures";

const email = process.env.E2E_HOSPITAL_EMAIL || "admin@hospital.com";
const password = process.env.E2E_HOSPITAL_PASSWORD || "Medinex@123";

test.describe("hospital admin configure", () => {
  test("configure page body scrolls when content overflows", async ({ page, ui }) => {
    await page.goto("/login");
    await ui("auth.login.email").fill(email);
    await ui("auth.login.password").fill(password);
    await ui("auth.login.submit").click();
    await page.waitForURL("**/hospitaladmin/**", { timeout: 20_000 });

    await page.goto("/hospitaladmin/configure");
    await expect(ui("hospitaladmin.configure")).toBeVisible({ timeout: 20_000 });
    await expect(ui("hospitaladmin.configure.loading")).toBeHidden({ timeout: 20_000 });

    const scroll = await ui("hospitaladmin.configure").evaluate((el) => {
      const before = el.scrollTop;
      el.scrollTop = 400;
      return {
        canOverflow: el.scrollHeight > el.clientHeight + 20,
        moved: el.scrollTop > before,
        overflowY: getComputedStyle(el).overflowY,
      };
    });

    expect(scroll.canOverflow, "configure content should be taller than the viewport").toBe(true);
    expect(scroll.overflowY).toMatch(/auto|scroll/);
    expect(scroll.moved, "configure root should accept scrollTop").toBe(true);
  });
});
