import { test, expect } from "./fixtures";

test.describe.configure({ mode: "serial" });

test.describe("superadmin onboard · complete appointment", () => {
  test("hospital admin can complete the booked appointment", async ({
    page,
    ui,
    patientDraft,
    appointmentDraft,
  }) => {
    await page.goto("/hospitaladmin/dashboard?tab=patients");
    await ui("hospitaladmin.patients.search").fill(patientDraft.phone);
    await ui("hospitaladmin.patients.view")
      .and(page.locator(`[data-ui-instance="${patientDraft.phone}"]`))
      .click();
    await ui("hospitaladmin.patients.details.appointments").click();
    const completeAppointment = ui("hospitaladmin.patients.appointment.complete")
      .and(page.locator(`[data-ui-instance="${appointmentDraft.date}-${appointmentDraft.timeSlot}"]`));
    await completeAppointment.click();

    await expect(completeAppointment).toHaveCount(0, { timeout: 15_000 });
  });
});
