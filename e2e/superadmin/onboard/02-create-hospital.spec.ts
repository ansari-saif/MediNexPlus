import { test, expect } from "./fixtures";

test.describe.configure({ mode: "serial" });

test.describe("superadmin onboard · create hospital", () => {
  test("superadmin can create a hospital", async ({ onboardedHospital, page }) => {
    test.setTimeout(90_000);
    await expect(page.getByText(onboardedHospital.hospitalName)).toBeVisible();
  });
});
