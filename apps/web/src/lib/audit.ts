import { prisma } from "@gymapps/db";
import { newId } from "@/lib/id";

type AuditEntry = {
  userId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string | null;
};

export async function writeAudit(entry: AuditEntry) {
  await prisma.auditLog.create({
    data: {
      id: newId("aud"),
      userId: entry.userId,
      actorId: entry.actorId ?? entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      before: entry.before as never,
      after: entry.after as never,
      ipAddress: entry.ipAddress ?? null
    }
  });
}
