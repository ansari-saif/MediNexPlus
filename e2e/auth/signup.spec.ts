import { test, expect } from "../fixtures";

test.describe("signup flow UIAnchors", () => {
  test("signup page inputs and submit button are present with UIAnchors", async ({ page, ui }) => {
    await page.goto("/signup");

    await expect(ui("auth.signup.hospital-name")).toBeVisible();
    await expect(ui("auth.signup.admin-name")).toBeVisible();
    await expect(ui("auth.signup.email")).toBeVisible();
    await expect(ui("auth.signup.mobile")).toBeVisible();
    await expect(ui("auth.signup.password")).toBeVisible();
    await expect(ui("auth.signup.confirm-password")).toBeVisible();
    await expect(ui("auth.signup.submit")).toBeVisible();
  });
});
