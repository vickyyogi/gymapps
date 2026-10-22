import { PrismaClient } from "@prisma/client";

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export { Prisma } from "@prisma/client";
export type { User, Session, Entitlement, Muscle, Equipment } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}
