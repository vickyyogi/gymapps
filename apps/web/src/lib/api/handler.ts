import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type { z, ZodTypeAny } from "zod";
import type { ActiveSession } from "@/lib/auth/session";
import { attachSessionCookie, requireSession } from "@/lib/auth/session";
import { ApiError, ValidationError } from "@/lib/api/errors";
import { log } from "@/lib/log";

type ApiContext = {
  request: NextRequest;
  requestId: string;
  session: ActiveSession | null;
};

type RouteHandler = (context: ApiContext) => Promise<NextResponse>;

const REQUEST_ID_PATTERN = /^[\w.-]{8,100}$/;

function requestIdFor(request: NextRequest) {
  const incoming = request.headers.get("x-request-id");
  return incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
}

function failure(error: unknown, requestId: string) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
          request_id: requestId
        }
      },
      { status: error.status, headers: error.headers }
    );
  }

  Sentry.captureException(error);
  log("error", "unhandled_api_error", { request_id: requestId, error });
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error",
        request_id: requestId
      }
    },
    { status: 500 }
  );
}

export function withApi(
  handler: RouteHandler,
  options: { auth?: boolean; refreshSession?: boolean } = {}
) {
  return async function route(request: NextRequest) {
    const startedAt = Date.now();
    const requestId = requestIdFor(request);

    try {
      const session = options.auth ? await requireSession() : null;
      const response = await handler({ request, requestId, session });

      if (options.auth && session && options.refreshSession !== false) {
        attachSessionCookie(response, session.rawToken);
      }
      response.headers.set("x-request-id", requestId);
      log("info", "request", {
        request_id: requestId,
        method: request.method,
        path: request.nextUrl.pathname,
        status: response.status,
        duration_ms: Date.now() - startedAt,
        user_id: session?.user.id
      });
      return response;
    } catch (error) {
      const response = failure(error, requestId);
      response.headers.set("x-request-id", requestId);
      log("warn", "request_failed", {
        request_id: requestId,
        method: request.method,
        path: request.nextUrl.pathname,
        status: response.status,
        duration_ms: Date.now() - startedAt,
        code: error instanceof ApiError ? error.code : "INTERNAL_ERROR"
      });
      return response;
    }
  };
}

type AuthedApiContext = ApiContext & { session: ActiveSession };

export function withAuthApi(
  handler: (context: AuthedApiContext) => Promise<NextResponse>,
  options: { refreshSession?: boolean } = {}
) {
  return withApi(
    (context) => handler({ ...context, session: context.session as ActiveSession }),
    { auth: true, refreshSession: options.refreshSession }
  );
}

export async function parseJson<T extends ZodTypeAny>(
  request: NextRequest,
  schema: T
): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError([{ path: "body", message: "Invalid JSON" }]);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw new ValidationError(
      parsed.error.issues.map((issue) => ({
        path: issue.path.join(".") || "body",
        message: issue.message
      }))
    );
  }
  return parsed.data;
}

export function clientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function rateLimitHeaders(remaining: number, resetAt: number) {
  return {
    "X-RateLimit-Limit": "5",
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000))
  };
}
