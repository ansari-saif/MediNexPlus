import { test, expect } from "./fixtures";

test.describe.configure({ mode: "serial" });

test.describe("superadmin onboard · create patient", () => {
  test("hospital admin can register a patient", async ({ page, ui, patientDraft }) => {
    test.setTimeout(90_000);

    await page.goto("/hospitaladmin/dashboard?tab=patients");
    await expect(ui("hospitaladmin.dashboard.tab.patients")).toBeVisible();
    await ui("hospitaladmin.patients.create").click();
    await ui("hospitaladmin.patients.form.name").fill(patientDraft.name);
    await ui("hospitaladmin.patients.form.phone").fill(patientDraft.phone);
    await ui("hospitaladmin.patients.form.gender").selectOption(patientDraft.gender);

    const created = page.waitForResponse(
      (res) => res.url().includes("/api/patients") && res.request().method() === "POST"
    );
    await ui("hospitaladmin.patients.form.submit").click();
    expect((await (await created).json()).success).toBe(true);

    await expect(ui("hospitaladmin.dashboard.tab.patients")).toBeVisible();
  });
});
