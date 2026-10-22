import { ProgramBuilder } from "@/components/phase4/program-builder";

export const dynamic = "force-dynamic";

export default async function ProgramPage({
  params
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  return <ProgramBuilder programId={programId} />;
}
