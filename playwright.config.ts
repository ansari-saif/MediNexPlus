import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.BASE_URL || "http://localhost:3000";
const onboardGlob = "**/superadmin/onboard/**/*.spec.ts";
const generatedRunId = `${new Date().toISOString().replace(/\D/g, "").slice(0, 14)}-${Math.random()
  .toString(36)
  .slice(2, 8)}`;
const runId = process.env.E2E_RUN_ID || generatedRunId;
if (!/^[a-zA-Z0-9._-]+$/.test(runId)) {
  throw new Error("E2E_RUN_ID may contain only letters, numbers, dots, underscores, and hyphens.");
}
process.env.E2E_RUN_ID = runId;

export default defineConfig({
  testDir: "e2e",
  outputDir: `test-results/runs/${runId}`,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  workers: 1,
  // Stop the worker after the first failed spec. Per-file `serial` does not
  // skip later files in this onboard chain.
  maxFailures: 1,
  reporter: [
    ["list"],
    ["./e2e/run-reporter.ts"],
  ],
  use: {
    baseURL,
    trace: "retain-on-failure",
    video: "off",
    screenshot: "only-on-failure",
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
