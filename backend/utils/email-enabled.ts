/** Real SMTP is opt-in. Set EMAIL_ENABLED=1 in .env when Gmail/app password is configured. */
export function isEmailEnabled() {
  return process.env.EMAIL_ENABLED === "1";
}
