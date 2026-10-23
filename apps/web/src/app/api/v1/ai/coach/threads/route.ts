import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { API_RATE_LIMITS } from "@gymapps/shared";
import { withAuthApi, parseJson, parseQuery } from "@/lib/api/handler";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { pageArgs, pageResult } from "@/lib/api/pagination";
import { getOwnedProgram } from "@/lib/api/resources";
import { threadCreateSchema, threadListSchema } from "@/lib/api/phase6-validation";
import { serializeThread } from "@/lib/api/phase6-serializers";
import { chatQuota } from "@/lib/ai/chat";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ request, session }) => {
  const query = parseQuery(request, threadListSchema);
  const rows = await prisma.chatThread.findMany({
    where: { userId: session.user.id, deletedAt: null },
    orderBy: [{ lastMessageAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    ...pageArgs(query.cursor, query.limit)
  });
  const page = pageResult(rows, query.limit);
  return NextResponse.json({
    data: page.data.map(serializeThread),
    nextCursor: page.nextCursor,
    meta: { quota: await chatQuota(session.user.id) }
  });
});

export const POST = withAuthApi(async ({ request, session }) => {
  await enforceRateLimit("coach-thread", session.user.id, API_RATE_LIMITS.coachThreadCreate);
  const input = await parseJson(request, threadCreateSchema);
  if (input.program_id) await getOwnedProgram(input.program_id, session.user.id);

  const thread = await prisma.chatThread.create({
    data: {
      id: newId("thr"),
      userId: session.user.id,
      title: input.title ?? null,
      programId: input.program_id ?? null
    }
  });
  return NextResponse.json({ data: serializeThread(thread) }, { status: 201 });
});
