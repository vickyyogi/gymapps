import { WorkoutLogger } from "@/components/phase4/workout-logger";

export const dynamic = "force-dynamic";

export default async function WorkoutPage({
  params
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  return <WorkoutLogger workoutId={workoutId} />;
}
