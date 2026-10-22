import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi, parseJson, parseQuery } from "@/lib/api/handler";
import { pageArgs, pageResult } from "@/lib/api/pagination";
import { ApiError } from "@/lib/api/errors";
import { idempotencyKeyFrom } from "@/lib/api/idempotency";
import { messageListSchema, messageSendSchema } from "@/lib/api/phase6-validation";
import { serializeMessage } from "@/lib/api/phase6-serializers";
import { redactPII } from "@/lib/ai/context";
import { chatAiConfig } from "@/lib/ai/config";
import {
  chatQuota,
  detectLanguage,
  guardrailTurn,
  medicalGuardrail,
  runChatTurn
} from "@/lib/ai/chat";
import { isFeatureEnabled } from "@/lib/ai/feature-flags";
import { newId } from "@/lib/id";

export const runtime = "nodejs";

async function ownedThread(threadId: string, userId: string) {
  const thread = await prisma.chatThread.findUnique({ where: { id: threadId } });
  if (!thread || thread.deletedAt) throw new ApiError(404, "NOT_FOUND", "Thread not found");
  if (thread.userId !== userId) throw new ApiError(403, "FORBIDDEN", "Thread belongs to another user");
  return thread;
}

function sse(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function streamResponse(
  run: (send: (event: string, data: unknown) => void) => Promise<void>,
  onCancel?: () => void
) {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(sse(event, data)));
        } catch {
          closed = true;
        }
      };
      void run(send)
        .catch(async () => {
          send("error", { code: "AI_UNAVAILABLE", message: "Coach response failed" });
        })
        .finally(() => {
          if (closed) return;
          closed = true;
          try {
            controller.close();
          } catch {
            // client already disconnected
          }
        });
    },
    cancel() {
      onCancel?.();
    }
  });
  return new NextResponse(body, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      "x-accel-buffering": "no"
    }
  });
}

export const GET = withAuthApi(async ({ request, params, session }) => {
  const thread = await ownedThread(String(params.threadId), session.user.id);
  const query = parseQuery(request, messageListSchema);
  const rows = await prisma.chatMessage.findMany({
    where: { threadId: thread.id },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    ...pageArgs(query.cursor, query.limit)
  });
  const page = pageResult(rows, query.limit);
  return NextResponse.json({
    data: page.data.map(serializeMessage),
    nextCursor: page.nextCursor
  });
});

export const POST = withAuthApi(async ({ request, params, session }) => {
  const thread = await ownedThread(String(params.threadId), session.user.id);
  const config = chatAiConfig();
  if (!config.enabled || !(await isFeatureEnabled("ai_chat"))) {
    throw new ApiError(503, "AI_UNAVAILABLE", "Coach chat is disabled");
  }

  const quota = await chatQuota(session.user.id);
  if (!quota.allowed) {
    throw new ApiError(429, "AI_RATE_LIMITED", "Coach chat rate limit reached", {
      details: [
        {
          path: "quota",
          message: `Sisa jam ini: ${quota.remaining_hour}, hari ini: ${quota.remaining_day}`
        }
      ],
      headers: { "Retry-After": String(Math.max(1, quota.retry_after_seconds)) }
    });
  }

  const input = await parseJson(request, messageSendSchema);
  const idempotencyKey = idempotencyKeyFrom(request);
  if (idempotencyKey) {
    const existing = await prisma.chatMessage.findFirst({
      where: { threadId: thread.id, idempotencyKey }
    });
    if (existing) {
      return streamResponse(async (send) => {
        send("meta", { message_id: existing.id, thread_id: thread.id });
        if (existing.content) send("delta", { text: existing.content });
        send("done", { replayed: true, status: existing.status });
      });
    }
  }

  const userContent = redactPII(input.content, session.user.displayName);
  const language = input.language ?? detectLanguage(userContent, session.user.locale === "en" ? "en" : "id");
  const userId = session.user.id;
  const assistantId = newId("msg");

  await prisma.$transaction(async (tx) => {
    await tx.chatMessage.create({
      data: {
        id: newId("msg"),
        threadId: thread.id,
        userId,
        role: "user",
        content: userContent,
        status: "complete"
      }
    });
    await tx.chatMessage.create({
      data: {
        id: assistantId,
        threadId: thread.id,
        userId,
        role: "assistant",
        content: "",
        status: "streaming",
        idempotencyKey
      }
    });
    await tx.chatThread.update({
      where: { id: thread.id },
      data: {
        messageCount: { increment: 2 },
        lastMessageAt: new Date(),
        ...(thread.title
          ? {}
          : {
              title: redactPII(input.content, session.user.displayName)
                .replace(/\s+/g, " ")
                .slice(0, 60)
            })
      }
    });
  });

  const abort = new AbortController();
  const onAbort = () => abort.abort();
  request.signal.addEventListener("abort", onAbort, { once: true });

  const safeText = medicalGuardrail(input.content);
  async function failMessage() {
    await prisma.chatMessage.updateMany({
      where: { id: assistantId, status: "streaming" },
      data: { status: "error" }
    });
  }

  return streamResponse(async (send) => {
    try {
      if (safeText) {
        await guardrailTurn(
          { userId, threadId: thread.id, assistantMessageId: assistantId, userContent, language, signal: abort.signal, send },
          safeText
        );
        return;
      }
      await runChatTurn({
        userId,
        threadId: thread.id,
        assistantMessageId: assistantId,
        userContent,
        language,
        signal: abort.signal,
        send
      });
    } catch (error) {
      await failMessage();
      throw error;
    } finally {
      request.signal.removeEventListener("abort", onAbort);
    }
  }, () => abort.abort());
});
