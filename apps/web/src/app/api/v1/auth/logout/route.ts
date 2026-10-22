import { NextResponse } from "next/server";
import { withAuthApi } from "@/lib/api/handler";
import { clearSessionCookie, revokeSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export const POST = withAuthApi(
  async ({ session }) => {
    await revokeSession(session.session.id);
    const response = new NextResponse(null, { status: 204 });
    clearSessionCookie(response);
    return response;
  },
  { refreshSession: false }
);
