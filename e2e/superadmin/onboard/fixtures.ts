import type { BrowserContext, Page } from "@playwright/test";
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

type FlowState = {
  hospital?: CreatedHospital;
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
    await this.ui("auth.superadmin.login.submit").click();
    await this.page.waitForURL("**/superadmin/dashboard**", { timeout: 20_000 });
    await expect(this.ui("superadmin.dashboard")).toBeVisible({ timeout: 15_000 });
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
    await this.ui("superadmin.hospitals.create.submit").click();

    await expect(this.ui("superadmin.hospitals.create.success")).toBeVisible({ timeout: 15_000 });
    await expect(this.ui("superadmin.dashboard")).toBeVisible({ timeout: 20_000 });
    await expect(this.page.getByText(data.hospitalName)).toBeVisible({ timeout: 15_000 });
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
    await this.ui("auth.login.submit").click();
    await this.page.waitForURL("**/hospitaladmin/**", { timeout: 20_000 });
    await expect(this.ui("hospitaladmin.dashboard")).toBeVisible({ timeout: 15_000 });
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
};

type OnboardWorkerFixtures = {
  sharedContext: BrowserContext;
  sharedPage: Page;
  flowState: FlowState;
};

export const test = base.extend<OnboardFixtures, OnboardWorkerFixtures>({
  // One browser context + tab for the whole onboard flow (all 3 files).
  sharedContext: [
    async ({ browser }, use) => {
      const context = await browser.newContext();
      await use(context);
      await context.close();
    },
    { scope: "worker" },
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
