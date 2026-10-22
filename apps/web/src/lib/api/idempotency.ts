import "server-only";

import { NextResponse } from "next/server";
import { prisma, Prisma } from "@gymapps/db";
import { ApiError } from "@/lib/api/errors";
import { newId } from "@/lib/id";

export function idempotencyKeyFrom(request: Request) {
  const key = request.headers.get("idempotency-key")?.trim();
  if (!key) return null;
  if (key.length > 200) {
    throw new ApiError(422, "VALIDATION_ERROR", "Idempotency-Key is too long", {
      details: [{ path: "Idempotency-Key", message: "Maximum 200 characters" }]
    });
  }
  return key;
}

export async function savedIdempotentResponse(
  userId: string,
  key: string,
  method: string,
  path: string
) {
  const row = await prisma.idempotencyKey.findFirst({ where: { userId, key } });
  if (!row) return null;
  if (row.method !== method || row.path !== path) {
    throw new ApiError(
      409,
      "IDEMPOTENCY_KEY_REUSED",
      "Idempotency-Key was already used for another request"
    );
  }
  return NextResponse.json(row.response, { status: row.statusCode });
}

export async function saveIdempotentResponse(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    key: string;
    method: string;
    path: string;
    statusCode: number;
    response: unknown;
  }
) {
  await tx.idempotencyKey.create({
    data: {
      id: newId("idm"),
      userId: input.userId,
      key: input.key,
      method: input.method,
      path: input.path,
      statusCode: input.statusCode,
      response: JSON.parse(JSON.stringify(input.response)) as Prisma.InputJsonValue
    }
  });
}
