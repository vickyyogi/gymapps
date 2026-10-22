import "server-only";

import { prisma } from "@gymapps/db";

/** DB flag wins when present; missing flags default on for beta. */
export async function isFeatureEnabled(key: string, fallback = true) {
  const flag = await prisma.featureFlag.findUnique({ where: { key } });
  return flag ? flag.enabled : fallback;
}
