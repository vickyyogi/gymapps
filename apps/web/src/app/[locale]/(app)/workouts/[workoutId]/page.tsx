import { getSession } from "@/lib/auth/session";
import { WorkoutLogger } from "@/components/phase4/workout-logger";
import type { UnitSystem } from "@gymapps/domain";

export const dynamic = "force-dynamic";

export default async function WorkoutPage({
  params
}: {
  params: Promise<{ workoutId: string }>;
}) {
  const { workoutId } = await params;
  const session = await getSession();
  const unitSystem: UnitSystem =
    session?.user.unitSystem === "imperial" ? "imperial" : "metric";

  return <WorkoutLogger workoutId={workoutId} unitSystem={unitSystem} />;
}
