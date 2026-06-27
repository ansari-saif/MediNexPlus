import { NextRequest, NextResponse } from "next/server";

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

export function setSessionCookie(
  response: NextResponse,
  req: NextRequest,
  token: string,
  sameSite: SessionSameSite = "lax"
) {
  response.cookies.set("hms_session", token, buildSessionCookieOptions(req, sameSite));
}

export function clearSessionCookie(response: NextResponse, req: NextRequest) {
  const opts = buildSessionCookieOptions(req);
  response.cookies.set({
    name: "hms_session",
    value: "",
    httpOnly: true,
    secure: opts.secure,
    sameSite: opts.sameSite,
    path: "/",
    expires: new Date(0),
  });
}
