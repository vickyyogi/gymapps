import { NextResponse } from "next/server";
import { withAuthApi } from "@/lib/api/handler";
import { getEntitlement, toCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ session }) => {
  const entitlement = await getEntitlement(session.user.id);
  return NextResponse.json({ data: toCurrentUser(session.user, entitlement) });
});
