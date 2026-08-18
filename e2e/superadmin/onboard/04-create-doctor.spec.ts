import { test, expect } from "./fixtures";

test.describe.configure({ mode: "serial" });

test.describe("superadmin onboard · create doctor", () => {
  test("hospital admin can create a doctor and weekly schedule", async ({
    page,
    ui,
    doctorDraft,
  }) => {
    test.setTimeout(90_000);

    await page.goto("/hospitaladmin/doctors");
    await expect(ui("hospitaladmin.doctors")).toBeVisible();
    await ui("hospitaladmin.doctors.create").click();
    await ui("hospitaladmin.doctors.form.name").fill(doctorDraft.name);
    await ui("hospitaladmin.doctors.form.email").fill(doctorDraft.email);
    await ui("hospitaladmin.doctors.form.phone").fill(doctorDraft.phone);
    await ui("hospitaladmin.doctors.form.specialization").fill(doctorDraft.specialization);
    await ui("hospitaladmin.doctors.form.consultation-fee").fill(doctorDraft.consultationFee);
    await ui("hospitaladmin.doctors.save").click();

    await ui("hospitaladmin.doctors.search").fill(doctorDraft.email);
    await expect(ui("hospitaladmin.doctors.search")).toHaveValue(doctorDraft.email);
    await ui("hospitaladmin.doctors.schedule").click();
    await expect(ui("hospitaladmin.doctors.schedule.loading")).toBeHidden({ timeout: 20_000 });
    await ui("hospitaladmin.doctors.schedule.full-week").click();
    await expect(ui("hospitaladmin.doctors.schedule.save")).toBeEnabled();

    // Wait for the persisted response: the next spec navigates away, which would
    // otherwise abort this POST and leave the doctor with no bookable slots.
    const savedSchedule = page.waitForResponse(
      (res) =>
        res.url().includes("/availability") && res.request().method() === "POST" && res.ok()
    );
    await ui("hospitaladmin.doctors.schedule.save").click();
    const scheduleBody = await (await savedSchedule).json();
    expect(scheduleBody.success).toBe(true);
  });
});
