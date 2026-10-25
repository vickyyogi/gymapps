import { readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../packages/db/src/generated/prisma/client";

// ponytail: no dotenv dependency; fall back to packages/db/.env when the shell
// does not provide DATABASE_URL (same file prisma.config.ts reads).
if (!process.env.DATABASE_URL) {
  for (const line of readFileSync(new URL("../packages/db/.env", import.meta.url), "utf8").split("\n")) {
    const match = /^\s*([\w.]+)\s*=\s*"?([^"\n]*)"?\s*$/.exec(line);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}

export function createPrisma(connectionString = process.env.DATABASE_URL) {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}
