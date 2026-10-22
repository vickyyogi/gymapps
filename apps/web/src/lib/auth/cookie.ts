import type { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_TTL_SECONDS } from "@gymapps/shared";

function cookieOptions(value: string, maxAge: number) {
  return {
    name: SESSION_COOKIE_NAME,
    value,
    httpOnly: true,
    // FR-01-03 says Secure always. Browsers refuse Secure cookies on http://localhost.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge
  };
}

export function attachSessionCookie(response: NextResponse, rawToken: string) {
  response.cookies.set(cookieOptions(rawToken, SESSION_TTL_SECONDS));
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(cookieOptions("", 0));
}
