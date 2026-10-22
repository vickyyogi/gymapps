import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createMiddleware(routing);

const APP_SEGMENTS = new Set([
  "",
  "dashboard",
  "workouts",
  "programs",
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
    !request.cookies.get("gymapps_session")?.value
  ) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/${locale}/login`;
    loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  request.headers.set("x-pathname", `${pathname}${request.nextUrl.search}`);
  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"]
};
