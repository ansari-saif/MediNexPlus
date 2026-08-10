export const UI_ID_PATTERN = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;

export function assertValidUiId(ui: string): void {
  if (process.env.NODE_ENV === "production") return;
  if (!UI_ID_PATTERN.test(ui)) {
    throw new Error(
      `[UIAnchor] Invalid UI id "${ui}". Expected lowercase dot-separated segments ` +
        `(e.g. "auth.login.submit").`
    );
  }
}