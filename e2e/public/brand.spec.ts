import { test, expect } from "../fixtures";

test.describe("public brand wordmark", () => {
  test("landing shows curify text, not the old logo image", async ({ page, ui }) => {
    await page.goto("/");
    await expect(ui("public.brand.wordmark").first()).toBeVisible();
    await expect(ui("public.brand.wordmark").first()).toHaveText("curify");
    await expect(page.locator('img[src*="medinexplus-logo"]')).toHaveCount(0);
  });

  test("landing copy says Curify, not MediNex", async ({ page, ui }) => {
    await page.goto("/");
    await expect(ui("public.brand.wordmark").first()).toBeVisible();
    await expect(page).toHaveTitle(/Curify/);
    await expect(page.getByText(/MediNex/i)).toHaveCount(0);
  });

  test("login shows curify text, not the old logo image", async ({ page, ui }) => {
    await page.goto("/login");
    await expect(ui("public.brand.wordmark").first()).toBeVisible();
    await expect(ui("public.brand.wordmark").first()).toHaveText("curify");
    await expect(page.locator('img[src*="medinexplus-logo"]')).toHaveCount(0);
  });
});
