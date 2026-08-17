import { writeFile } from "node:fs/promises";
import type {
  BrowserContext,
  ConsoleMessage,
  Page,
  Request,
  Response,
} from "@playwright/test";
import { test as base, expect } from "../../fixtures";
import type { UiFixture } from "../../fixtures";

export type SuperAdminCreds = {
  email: string;
  password: string;
  securityKey: string;
};

export type CreatedHospital = {
  hospitalName: string;
  adminEmail: string;
  adminPassword: string;
};

export type DoctorDraft = {
  name: string;
  email: string;
  phone: string;
  specialization: string;
  consultationFee: string;
};

export type PatientDraft = {
  name: string;
  phone: string;
  gender: "MALE" | "FEMALE" | "OTHER";
};

export type AppointmentDraft = {
  date: string;
  timeSlot: string;
};

type FlowState = {
  hospital?: CreatedHospital;
  /** Title of the first spec that failed; later specs in the chain stop instead of cascading. */
  failedAt?: string;
};

/** Page object for `/superadmin/login`. */
export class SuperAdminLoginPage {
  constructor(
    readonly page: Page,
    readonly ui: UiFixture
  ) {}

  async login(creds: SuperAdminCreds) {
    await this.page.goto("/superadmin/login");
    await this.ui("auth.superadmin.login.email").fill(creds.email);
    await this.ui("auth.superadmin.login.password").fill(creds.password);
    await this.ui("auth.superadmin.login.security-key").fill(creds.securityKey);
    const loggedIn = this.page.waitForResponse(
      (res) => res.url().includes("/api/auth/superadmin") && res.request().method() === "POST"
    );
    await this.ui("auth.superadmin.login.submit").click();
    expect((await (await loggedIn).json()).success).toBe(true);
    await this.page.goto("/superadmin/dashboard", { waitUntil: "domcontentloaded" });
    await expect(this.ui("superadmin.dashboard")).toBeVisible({ timeout: 20_000 });
  }
}

/** Page object for superadmin dashboard hospital onboarding. */
export class SuperAdminDashboardPage {
  constructor(
    readonly page: Page,
    readonly ui: UiFixture
  ) {}

  async goto() {
    await this.page.goto("/superadmin/dashboard");
    await expect(this.ui("superadmin.dashboard")).toBeVisible({ timeout: 15_000 });
  }

  async createHospital(data: CreatedHospital) {
    await this.ui("superadmin.hospitals.create.open").click();
    await this.ui("superadmin.hospitals.create.name").fill(data.hospitalName);
    await this.ui("superadmin.hospitals.create.admin-name").fill("E2E Admin");
    await this.ui("superadmin.hospitals.create.mobile").fill("9876543210");
    await this.ui("superadmin.hospitals.create.email").fill(data.adminEmail);
    await this.ui("superadmin.hospitals.create.password").fill(data.adminPassword);
    await this.ui("superadmin.hospitals.create.confirm-password").fill(data.adminPassword);

    const created = this.page.waitForResponse(
      (res) =>
        res.url().includes("/api/hospital/create") &&
        res.request().method() === "POST",
      { timeout: 45_000 }
    );
    await this.ui("superadmin.hospitals.create.submit").click();
    const body = await (await created).json();
    expect(body.success).toBe(true);

    await expect(this.page.getByText(data.hospitalName)).toBeVisible({ timeout: 30_000 });
  }
}

/** Page object for hospital admin `/login`. */
export class HospitalAdminLoginPage {
  constructor(
    readonly page: Page,
    readonly ui: UiFixture
  ) {}

  async login(email: string, password: string) {
    await this.page.goto("/login");
    await this.ui("auth.login.email").fill(email);
    await this.ui("auth.login.password").fill(password);
    const loggedIn = this.page.waitForResponse(
      (res) => res.url().includes("/api/auth/login") && res.request().method() === "POST"
    );
    await this.ui("auth.login.submit").click();
    expect((await (await loggedIn).json()).success).toBe(true);
    await this.page.goto("/hospitaladmin/dashboard", { waitUntil: "domcontentloaded" });
    await expect(this.ui("hospitaladmin.dashboard")).toBeVisible({ timeout: 30_000 });
  }
}

type OnboardFixtures = {
  superadminCreds: SuperAdminCreds;
  hospitalDraft: CreatedHospital;
  superAdminLogin: SuperAdminLoginPage;
  superAdminDashboard: SuperAdminDashboardPage;
  hospitalAdminLogin: HospitalAdminLoginPage;
  onboardedHospital: CreatedHospital;
  createdHospital: CreatedHospital;
  _diagnostics: void;
};

type OnboardWorkerFixtures = {
  sharedContext: BrowserContext;
  sharedPage: Page;
  flowState: FlowState;
  // Worker-scoped so every spec in the serial flow acts on the same records.
  doctorDraft: DoctorDraft;
  patientDraft: PatientDraft;
  appointmentDraft: AppointmentDraft;
};

export const test = base.extend<OnboardFixtures, OnboardWorkerFixtures>({
  // One browser context + tab for the whole onboard flow.
  sharedContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext(
        process.env.E2E_VIDEO
          ? {
              recordVideo: {
                dir: `${process.cwd()}/test-results/runs/${process.env.E2E_RUN_ID}/videos`,
                size: { width: 1280, height: 720 },
              },
            }
          : {}
      );
      await use(context);
      await context.close();
    },
    { scope: "worker", timeout: 120_000 },
  ],

  sharedPage: [
    async ({ sharedContext }, use) => {
      const page = await sharedContext.newPage();
      await use(page);
    },
    { scope: "worker" },
  ],

  flowState: [
    async ({}, use) => {
      await use({});
    },
    { scope: "worker" },
  ],

  context: async ({ sharedContext }, use) => {
    await use(sharedContext);
  },

  page: async ({ sharedPage }, use) => {
    await use(sharedPage);
  },

  _diagnostics: [
    async ({ context, page, flowState }, use, testInfo) => {
      // Each spec depends on the previous one. testInfo.skip() only annotates;
      // test.skip() aborts this spec so later files do not cascade.
      if (flowState.failedAt) {
        test.skip(true, `onboard flow already failed at: ${flowState.failedAt}`);
      }

      const consoleEvents: Array<Record<string, unknown>> = [];
      const networkEvents: Array<Record<string, unknown>> = [];

      const onConsole = (message: ConsoleMessage) => {
        consoleEvents.push({
          type: message.type(),
          text: message.text(),
          location: message.location(),
        });
      };
      const onPageError = (error: Error) => {
        consoleEvents.push({ type: "pageerror", text: error.message, stack: error.stack });
      };
      const onRequestFailed = (request: Request) => {
        networkEvents.push({
          type: "requestfailed",
          method: request.method(),
          url: request.url(),
          failure: request.failure()?.errorText,
        });
      };
      const onResponse = (response: Response) => {
        if (response.status() >= 400) {
          networkEvents.push({
            type: "http-error",
            method: response.request().method(),
            url: response.url(),
            status: response.status(),
            statusText: response.statusText(),
          });
        }
      };

      page.on("console", onConsole);
      page.on("pageerror", onPageError);
      page.on("requestfailed", onRequestFailed);
      page.on("response", onResponse);

      await use();

      const failed = testInfo.status !== testInfo.expectedStatus;
      if (failed) flowState.failedAt ??= testInfo.titlePath.join(" › ");

      if (failed) {
        const [browserMetrics, cookies] = await Promise.all([
          page
            .evaluate(() => ({
              url: location.href,
              localStorageKeys: Object.keys(localStorage).sort(),
              sessionStorageKeys: Object.keys(sessionStorage).sort(),
            }))
            .catch(() => null),
          context
            .cookies()
            .then((items) =>
              items.map(({ name, domain, path, expires, httpOnly, secure, sameSite }) => ({
                name,
                domain,
                path,
                expires,
                httpOnly,
                secure,
                sameSite,
              }))
            )
            .catch(() => null),
        ]);

        const diagnosticsPath = testInfo.outputPath("diagnostics.json");
        await writeFile(
          diagnosticsPath,
          JSON.stringify(
            {
              console: consoleEvents,
              networkFailures: networkEvents,
              performance: { browser: browserMetrics },
              application: { cookies },
            },
            null,
            2
          )
        );
        await testInfo.attach("diagnostics.json", {
          path: diagnosticsPath,
          contentType: "application/json",
        });
        await page
          .screenshot({ path: testInfo.outputPath("failure.png"), fullPage: true })
          .then(() =>
            testInfo.attach("failure.png", {
              path: testInfo.outputPath("failure.png"),
              contentType: "image/png",
            })
          )
          .catch(() => undefined);
      }

      page.off("console", onConsole);
      page.off("pageerror", onPageError);
      page.off("requestfailed", onRequestFailed);
      page.off("response", onResponse);
    },
    { auto: true, timeout: 60_000 },
  ],

  superadminCreds: [
    {
      email: process.env.E2E_SUPERADMIN_EMAIL || "admin@medinex.com",
      password: process.env.E2E_SUPERADMIN_PASSWORD || "Medinex@123",
      securityKey: process.env.E2E_SUPERADMIN_SECURITY_KEY || "medinex-dev-key-2026",
    },
    { option: true },
  ],

  hospitalDraft: async ({}, use) => {
    const suffix = Date.now();
    await use({
      hospitalName: `E2E Hospital ${suffix}`,
      adminEmail: `e2e.hospital.${suffix}@example.com`,
      adminPassword: "Medinex@123",
    });
  },

  doctorDraft: [
    async ({}, use) => {
      const suffix = Date.now();
      await use({
        name: `Dr E2E ${suffix}`,
        email: `e2e.doctor.${suffix}@example.com`,
        phone: `98${String(suffix).slice(-8)}`,
        specialization: "General Medicine",
        consultationFee: "500",
      });
    },
    { scope: "worker" },
  ],

  patientDraft: [
    async ({}, use) => {
      const suffix = Date.now();
      await use({
        name: `E2E Patient ${suffix}`,
        phone: `97${String(suffix).slice(-8)}`,
        gender: "MALE",
      });
    },
    { scope: "worker" },
  ],

  appointmentDraft: [
    async ({}, use) => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      const localDate = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0"),
      ].join("-");
      await use({ date: localDate, timeSlot: "09:00" });
    },
    { scope: "worker" },
  ],

  superAdminLogin: async ({ page, ui, superadminCreds }, use) => {
    const loginPage = new SuperAdminLoginPage(page, ui);
    await loginPage.login(superadminCreds);
    await use(loginPage);
  },

  superAdminDashboard: async ({ page, ui }, use) => {
    await use(new SuperAdminDashboardPage(page, ui));
  },

  hospitalAdminLogin: async ({ page, ui }, use) => {
    await use(new HospitalAdminLoginPage(page, ui));
  },

  onboardedHospital: async ({ superAdminDashboard, hospitalDraft, flowState }, use) => {
    await superAdminDashboard.goto();
    await superAdminDashboard.createHospital(hospitalDraft);
    flowState.hospital = hospitalDraft;
    await use(hospitalDraft);
  },

  createdHospital: async ({ flowState }, use) => {
    if (!flowState.hospital) {
      throw new Error("No hospital in flow state. Run 02-create-hospital before 03-hospital-admin-login.");
    }
    await use(flowState.hospital);
  },
});

export { expect };
export type { UiFixture };
