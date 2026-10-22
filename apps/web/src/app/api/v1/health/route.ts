import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withApi } from "@/lib/api/handler";
import { log } from "@/lib/log";

export const runtime = "nodejs";

export const GET = withApi(async () => {
  const timestamp = new Date().toISOString();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      version: process.env.APP_VERSION ?? "dev",
      timestamp
    });
  } catch (error) {
    log("error", "health_db_unreachable", { error });
    return NextResponse.json(
      { status: "degraded", version: process.env.APP_VERSION ?? "dev", timestamp },
      { status: 503 }
    );
  }
});
