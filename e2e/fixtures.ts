import { test as base, expect, type Locator } from "@playwright/test";
import type { UIAnchorId } from "../src/lib/uianchor/ids.generated";

export type UiFixture = (ui: UIAnchorId) => Locator;

export const test = base.extend<{ ui: UiFixture }>({
  ui: async ({ page }, use) => {
    const ui = (id: UIAnchorId) => page.locator(`[data-ui="${id}"]`);
    await use(ui);
  },
});

export { expect };
export type { UIAnchorId };
