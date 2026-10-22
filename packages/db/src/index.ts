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
} from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}
