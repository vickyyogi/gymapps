import { NextResponse } from "next/server";
import { prisma } from "@gymapps/db";
import { withAuthApi } from "@/lib/api/handler";
import { expireAbandonedWorkouts } from "@/lib/api/resources";
import { serializeWorkout, workoutSummaryInclude } from "@/lib/api/serializers";

export const runtime = "nodejs";

export const GET = withAuthApi(async ({ session }) => {
  await expireAbandonedWorkouts(session.user.id);
  const rows = await prisma.workout.findMany({
    where: { userId: session.user.id, status: "active", deletedAt: null },
    include: workoutSummaryInclude,
    orderBy: { startedAt: "desc" }
  });
  return NextResponse.json({
    data: rows.map((workout) =>
      serializeWorkout(workout, {
        exerciseCount: workout.exercises.length,
        prCount: workout.sets.length
      })
    )
  });
});
