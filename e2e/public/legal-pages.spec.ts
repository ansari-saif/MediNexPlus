import { test, expect } from "../fixtures";

test.describe("public legal pages UIAnchors", () => {
  test("cookie policy page landmark is visible", async ({ page, ui }) => {
    await page.goto("/cookie-policy");
    await expect(ui("public.cookie-policy")).toBeVisible();
  });

  test("privacy policy page landmark is visible", async ({ page, ui }) => {
    await page.goto("/privacy-policy");
    await expect(ui("public.privacy-policy")).toBeVisible();
  });

  test("terms of service page landmark is visible", async ({ page, ui }) => {
    await page.goto("/terms-of-service");
    await expect(ui("public.terms-of-service")).toBeVisible();
  });
});
