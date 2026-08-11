import { test, expect } from "../fixtures";

test.describe("marketing site removed", () => {
  test("/ sends visitors to login", async ({ page, ui }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
    await expect(ui("auth.login.email")).toBeVisible();
  });

  test("marketing pages are gone", async ({ page }) => {
    for (const path of ["/about", "/treatments", "/contact"]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(404);
    }
  });
});
