import type { UnitSystem } from "@gymapps/domain";
import { getSession } from "@/lib/auth/session";
import { ExerciseLibrary } from "@/components/phase4/exercise-library";

export const dynamic = "force-dynamic";

export default async function ExercisesPage() {
  const session = await getSession();
  const unitSystem: UnitSystem =
    session?.user.unitSystem === "imperial" ? "imperial" : "metric";

  return <ExerciseLibrary unitSystem={unitSystem} />;
}
