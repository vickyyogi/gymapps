import "server-only";

import { ApiError } from "@/lib/api/errors";
import type { ActiveSession } from "@/lib/auth/session";

export function requireAdmin(session: ActiveSession) {
  if (session.user.role !== "admin") {
    throw new ApiError(403, "FORBIDDEN", "Admin role required");
  }
}
