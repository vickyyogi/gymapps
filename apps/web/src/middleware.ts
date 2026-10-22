import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "@gymapps/shared";
import { attachSessionCookie } from "@/lib/auth/cookie";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const APP_SEGMENTS = new Set([
  "",
  "dashboard",
  "onboarding",
  "workouts",
  "programs",
  "exercises",
  "progress",
  "analytics",
  "coach",
  "settings"
]);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const [, maybeLocale, maybeSegment] = pathname.split("/");
  const locale = (routing.locales as readonly string[]).includes(maybeLocale ?? "")
    ? maybeLocale
    : undefined;

  if (
    locale &&
    APP_SEGMENTS.has(maybeSegment ?? "") &&
    !request.cookies.get(SESSION_COOKIE_NAME)?.value
  ) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${locale}/login`;
    loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  request.headers.set("x-pathname", `${pathname}${request.nextUrl.search}`);
  const response = intlMiddleware(request);

  // Sliding expiry for page navigation. API responses refresh in withApi();
  // server components cannot set cookies. DB still validates the token.
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) attachSessionCookie(response, token);

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"]
};
