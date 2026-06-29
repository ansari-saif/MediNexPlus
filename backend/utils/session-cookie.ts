import { NextRequest, NextResponse } from "next/server";

export const SESSION_COOKIE = "hms_session";
export const SUPERADMIN_SESSION_COOKIE = "hms_superadmin_session";

const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

function cookieSecureOverride(): boolean | undefined {
  const value = process.env.COOKIE_SECURE?.toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

/** Detect HTTPS from the request (direct or via reverse proxy). */
export function isSecureRequest(req: NextRequest): boolean {
  const override = cookieSecureOverride();
  if (override !== undefined) return override;

  const forwarded = req.headers.get("x-forwarded-proto");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() === "https";
  }

  return req.nextUrl.protocol === "https:";
}

type SessionSameSite = "strict" | "lax" | "none";

export function buildSessionCookieOptions(req: NextRequest, sameSite: SessionSameSite = "lax") {
  return {
    httpOnly: true,
    secure: isSecureRequest(req),
    sameSite,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export type SessionPortal = "default" | "superadmin";

export function getSessionCookieName(portal: SessionPortal = "default"): string {
  return portal === "superadmin" ? SUPERADMIN_SESSION_COOKIE : SESSION_COOKIE;
}

export function getSessionToken(req: NextRequest, portal: SessionPortal = "default"): string {
  return req.cookies.get(getSessionCookieName(portal))?.value || "";
}

export function setSessionCookie(
  response: NextResponse,
  req: NextRequest,
  token: string,
  sameSite: SessionSameSite = "lax"
) {
  response.cookies.set(SESSION_COOKIE, token, buildSessionCookieOptions(req, sameSite));
}

/** Superadmin uses a separate cookie so hospital/staff login cannot overwrite it. */
export function setSuperAdminSessionCookie(
  response: NextResponse,
  req: NextRequest,
  token: string,
  sameSite: SessionSameSite = "lax"
) {
  response.cookies.set(SUPERADMIN_SESSION_COOKIE, token, buildSessionCookieOptions(req, sameSite));
}

function clearNamedSessionCookie(response: NextResponse, req: NextRequest, name: string) {
  const opts = buildSessionCookieOptions(req);
  response.cookies.set({
    name,
    value: "",
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: "/",
    expires: new Date(0),
  });
}

export function clearSessionCookie(response: NextResponse, req: NextRequest) {
  clearNamedSessionCookie(response, req, SESSION_COOKIE);
}

export function clearSuperAdminSessionCookie(response: NextResponse, req: NextRequest) {
  clearNamedSessionCookie(response, req, SUPERADMIN_SESSION_COOKIE);
}

export function clearAllSessionCookies(response: NextResponse, req: NextRequest) {
  clearSessionCookie(response, req);
  clearSuperAdminSessionCookie(response, req);
}
