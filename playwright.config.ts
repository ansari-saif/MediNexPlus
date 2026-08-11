import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://localhost:3000";
const onboardGlob = "**/superadmin/onboard/**/*.spec.ts";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      testIgnore: onboardGlob,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      // Single project → one browser for login → create → hospital login
      name: "superadmin-onboard",
      testMatch: onboardGlob,
      fullyParallel: false,
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
