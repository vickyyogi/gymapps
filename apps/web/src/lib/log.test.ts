import { describe, expect, it } from "vitest";
import { toLogValue } from "./log";

describe("log serialization", () => {
  it("keeps Error message and stack", () => {
    const error = new Error("boom", { cause: new Error("root") });
    const value = toLogValue({ error }) as {
      error: { message: string; stack?: string; cause: { message: string } };
    };

    expect(value.error.message).toBe("boom");
    expect(value.error.stack).toContain("boom");
    expect(value.error.cause.message).toBe("root");
  });
});
