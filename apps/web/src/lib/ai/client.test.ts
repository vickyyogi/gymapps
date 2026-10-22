import { afterEach, describe, expect, it } from "vitest";
import { computeCostUsd, parseModelOutput } from "./client";

const original = { ...process.env };

afterEach(() => {
  process.env = { ...original };
});

describe("AI model output", () => {
  it("parses emit_program tool arguments", () => {
    expect(
      parseModelOutput({
        tool_calls: [{ function: { name: "emit_program", arguments: '{"name":"A"}' } }]
      })
    ).toEqual({ name: "A" });
  });

  it("parses fenced JSON content when no tool call is returned", () => {
    expect(parseModelOutput({ content: '```json\n{"name":"B"}\n```' })).toEqual({ name: "B" });
  });

  it("rejects invalid JSON", () => {
    expect(() => parseModelOutput({ content: "not json" })).toThrow(/valid JSON/);
  });
});

describe("AI cost", () => {
  it("records cost from token usage and env prices", () => {
    process.env.OPENCODE_GO_PRICE_MAIN_IN = "1";
    process.env.OPENCODE_GO_PRICE_MAIN_OUT = "2";
    expect(computeCostUsd(1000, 500, "main")).toBeCloseTo(0.002);
  });
});
