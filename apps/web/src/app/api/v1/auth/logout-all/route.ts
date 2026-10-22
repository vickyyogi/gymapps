import { NextResponse } from "next/server";
import { withAuthApi } from "@/lib/api/handler";
import { clearSessionCookie, revokeAllSessions } from "@/lib/auth/session";

export const runtime = "nodejs";

export const POST = withAuthApi(
  async ({ session }) => {
    await revokeAllSessions(session.user.id);
    const response = new NextResponse(null, { status: 204 });
    clearSessionCookie(response);
    return response;
  },
  { refreshSession: false }
);
