import { test as base, expect, type Locator, type Page } from "@playwright/test";
import type { UIAnchorId } from "../src/lib/uianchor/ids.generated";

export type UiFixture = (ui: UIAnchorId) => Locator;

function isBenignPageError(message: string) {
  // ResizeObserver noise is common and unrelated to app correctness.
  return /ResizeObserver loop/i.test(message);
}

/**
 * Fail the spec if Chromium threw (hydration, overlay, uncaught exception).
 * Playwright does not fail on `pageerror` unless we assert it.
 */
async function assertNoBrowserRuntimeErrors(page: Page, pageErrors: string[]) {
  const fatal = pageErrors.filter((message) => !isBenignPageError(message));
  if (page.isClosed()) {
    expect(fatal, fatal.join("\n\n")).toEqual([]);
    return;
  }
  const overlay = page.locator("nextjs-portal");
  const overlayOpen = (await overlay.count()) > 0;
  const overlayText = overlayOpen
    ? (await overlay.innerText().catch(() => "Next.js error overlay")).slice(0, 2000)
    : "";
  expect(
    fatal,
    ["Uncaught page error(s):", ...fatal, overlayText].filter(Boolean).join("\n\n"),
  ).toEqual([]);
  await expect(overlay, overlayText || "Next.js error overlay was open").toHaveCount(0);
}

export const test = base.extend<{ ui: UiFixture; catchPageRuntimeErrors: void }>({
  ui: async ({ page }, use) => {
    const ui = (id: UIAnchorId) => page.locator(`[data-ui="${id}"]`);
    await use(ui);
  },
  catchPageRuntimeErrors: [
    async ({ page }, use) => {
      const pageErrors: string[] = [];
      const onPageError = (error: Error) => {
        pageErrors.push(error.message);
      };
      page.on("pageerror", onPageError);
      try {
        await use();
      } finally {
        page.off("pageerror", onPageError);
      }
      await assertNoBrowserRuntimeErrors(page, pageErrors);
    },
    { auto: true },
  ],
});

test.beforeEach(async ({}, testInfo) => {
  testInfo.setTimeout(Math.max(testInfo.timeout, 120_000));
});

/** Login pages are small — wait for the document so inputs are not detached mid-fill. */
export async function gotoLogin(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 60_000 });
}

/** Heavy dashboards may never fire `load`; wait for the response, then the landmark. */
export async function gotoDashboard(page: Page, path: string) {
  await page.goto(path, { waitUntil: "commit", timeout: 90_000 });
}

async function postLogin(page: Page, loginApi: string, email: string, password: string) {
  const res = await page.request.post(loginApi, {
    data: { email, password },
    headers: { "Content-Type": "application/json" },
  });
  const body = await res.json();
  expect(body.success, body.message || `login failed (${res.status()})`).toBe(true);
}

/**
 * Fill the login form (proves the UIAnchors exist) then authenticate through
 * `page.request` so the session cookie is set even if the client bundle has
 * not hydrated yet. A native form GET would otherwise swallow the POST.
 */
export async function signInPortal(
  page: Page,
  ui: UiFixture,
  opts: {
    loginPath: string;
    dashboardPath: string;
    emailId: UIAnchorId;
    passwordId: UIAnchorId;
    submitId: UIAnchorId;
    loginApi: string;
    email: string;
    password: string;
  },
) {
  await gotoLogin(page, opts.loginPath);
  await ui(opts.emailId).fill(opts.email, { timeout: 30_000 });
  await ui(opts.passwordId).fill(opts.password);
  await postLogin(page, opts.loginApi, opts.email, opts.password);
  await gotoDashboard(page, opts.dashboardPath);
}

export async function signInParentDept(
  page: Page,
  ui: UiFixture,
  email: string,
  password: string,
) {
  await gotoLogin(page, "/parentdept/login");
  await ui("auth.parentdept.login.email").fill(email, { timeout: 30_000 });
  await ui("auth.parentdept.login.password").fill(password);
  await postLogin(page, "/api/auth/parentdept/login", email, password);
}

export { expect };
export type { UIAnchorId };
