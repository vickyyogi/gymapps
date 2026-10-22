import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AdminExerciseEditor } from "@/components/phase7/admin-exercise-editor";

export const dynamic = "force-dynamic";

export default async function AdminExercisesPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSession();
  if (!session || session.user.role !== "admin") {
    redirect(`/${locale}/dashboard`);
  }
  return <AdminExerciseEditor />;
}
