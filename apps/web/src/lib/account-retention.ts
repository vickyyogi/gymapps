import "server-only";

import { prisma } from "@gymapps/db";
import { deleteExportFile } from "@/lib/ai/exports";

export const ACCOUNT_RETENTION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Hard-deletes accounts that have been in `pending_delete` for at least 30 days.
 * Per ADR-004 and FR-13-07:
 * - Removes export/report files on disk before cascading user-scoped DB rows.
 * - AuditLog rows have `onDelete: SetNull` on `userId`/`actorId` and store no PII.
 */
export async function purgeExpiredAccounts(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - ACCOUNT_RETENTION_DAYS * DAY_MS);
  const candidates = await prisma.user.findMany({
    where: {
      status: "pending_delete",
      deletedAt: { lte: cutoff }
    },
    select: {
      id: true,
      exports: { select: { filePath: true } }
    }
  });

  for (const user of candidates) {
    for (const exp of user.exports) {
      await deleteExportFile(exp);
    }
    await prisma.user.delete({ where: { id: user.id } });
  }

  return candidates.length;
}
