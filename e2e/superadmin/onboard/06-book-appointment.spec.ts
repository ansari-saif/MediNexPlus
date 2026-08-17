import { test, expect } from "./fixtures";

test.describe.configure({ mode: "serial" });

test.describe("superadmin onboard · book appointment", () => {
  test("hospital admin can book the patient with the new doctor", async ({
    page,
    ui,
    doctorDraft,
    patientDraft,
    appointmentDraft,
  }) => {
    test.setTimeout(90_000);

    await page.goto("/hospitaladmin/appointments");
    await expect(ui("hospitaladmin.appointments")).toBeVisible();
    await ui("hospitaladmin.appointments.create").click();
    await ui("hospitaladmin.appointments.booking.patient-search").fill(patientDraft.phone);
    await ui("hospitaladmin.appointments.booking.patient-result")
      .and(page.locator(`[data-ui-instance="${patientDraft.phone}"]`))
      .click();
    await ui("hospitaladmin.appointments.booking.doctor")
      .and(page.locator(`[data-ui-instance="${doctorDraft.name}"]`))
      .click();
    await ui("hospitaladmin.appointments.booking.date").fill(appointmentDraft.date);
    const slot = ui("hospitaladmin.appointments.booking.slot").and(
      page.locator(`[data-ui-instance="${appointmentDraft.timeSlot}"]`)
    );
    await expect(slot).toBeVisible({ timeout: 20_000 });
    await slot.click();
    await ui("hospitaladmin.appointments.booking.confirm").click();

    await ui("hospitaladmin.appointments.search").fill(patientDraft.phone);
    await expect(page.getByText(patientDraft.name)).toBeVisible({ timeout: 15_000 });
  });
});
