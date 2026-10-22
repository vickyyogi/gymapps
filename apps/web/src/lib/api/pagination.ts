import { ApiError } from "@/lib/api/errors";

export function encodeCursor(id: string): string {
  return Buffer.from(id, "utf8").toString("base64url");
}

export function decodeCursor(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const id = Buffer.from(value, "base64url").toString("utf8");
    if (!id || id.length > 200) throw new Error("invalid");
    return id;
  } catch {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid cursor", {
      details: [{ path: "cursor", message: "Invalid cursor" }]
    });
  }
}

export function pageArgs(cursor: string | undefined, limit: number) {
  const id = decodeCursor(cursor);
  return {
    take: limit + 1,
    ...(id ? { cursor: { id }, skip: 1 } : {})
  };
}

export function pageResult<T extends { id: string }>(rows: T[], limit: number) {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const last = data[data.length - 1];
  return {
    data,
    nextCursor: hasMore && last ? encodeCursor(last.id) : null
  };
}
