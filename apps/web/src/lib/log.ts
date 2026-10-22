type Level = "info" | "warn" | "error";

export function toLogValue(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      ...(value.cause === undefined ? {} : { cause: toLogValue(value.cause) })
    };
  }
  if (Array.isArray(value)) return value.map(toLogValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, toLogValue(entry)])
    );
  }
  return value;
}

export function log(level: Level, message: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...(toLogValue(fields) as Record<string, unknown>)
  });

  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
