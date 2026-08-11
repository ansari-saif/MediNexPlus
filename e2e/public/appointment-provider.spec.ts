import { test, expect } from "../fixtures";

test.describe("AppointmentProvider", () => {
  test("is mounted on login so booking modal can open", async ({ page, ui }) => {
    await page.goto("/login");
    await expect(ui("auth.login.email")).toBeVisible();
    await expect(ui("public.appointment.provider")).toBeAttached();
  });
});
