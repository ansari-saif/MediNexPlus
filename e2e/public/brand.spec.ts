import { test, expect } from "../fixtures";

test.describe("public brand wordmark", () => {
  test("login shows curify text, not the old logo image", async ({ page, ui }) => {
    await page.goto("/login");
    await expect(ui("public.brand.wordmark").first()).toBeVisible();
    await expect(ui("public.brand.wordmark").first()).toHaveText("curify");
  });
});
