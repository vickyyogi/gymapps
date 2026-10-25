import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export { Prisma } from "./generated/prisma/client";
export type {
  User,
  Session,
  Entitlement,
  Muscle,
  MuscleGroup,
  Equipment,
  Exercise,
  Program,
  ProgramWeek,
  ProgramSession,
  ProgramExercise,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  PersonalRecord,
  UserProfile,
  BodyMetric,
  Note,
  PromptVersion,
  AiGeneration,
  ChatThread,
  ChatMessage,
  AiRecommendation,
  Export,
  Notification,
  FeatureFlag,
  AuditLog
} from "./generated/prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}
