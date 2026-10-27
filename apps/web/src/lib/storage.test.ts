import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { deleteObject, getObject, putObject } from "@/lib/storage";

describe("storage local driver", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "gymapps-storage-"));
    vi.stubEnv("EXPORT_DIR", dir);
    vi.stubEnv("S3_BUCKET", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(dir, { recursive: true, force: true });
  });

  it("round-trips an object and reports size", async () => {
    const stored = await putObject("exports/exp_1.csv", "a,b\n1,2\n", "text/csv");
    expect(stored.ref).toBe(path.join(dir, "exports/exp_1.csv"));
    expect(stored.size).toBe(8);
    expect((await getObject(stored.ref)).toString("utf8")).toBe("a,b\n1,2\n");
  });

  it("reads legacy absolute refs outside EXPORT_DIR", async () => {
    const legacy = await putObject("legacy.json", "{}", "application/json");
    vi.stubEnv("EXPORT_DIR", path.join(dir, "other"));
    expect((await getObject(legacy.ref)).toString("utf8")).toBe("{}");
  });

  it("deletes idempotently and ignores null", async () => {
    const stored = await putObject("exports/exp_2.json", "{}", "application/json");
    await deleteObject(stored.ref);
    await expect(getObject(stored.ref)).rejects.toThrow();
    await expect(deleteObject(stored.ref)).resolves.toBeUndefined();
    await expect(deleteObject(null)).resolves.toBeUndefined();
  });
});
