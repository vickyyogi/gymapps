import { NextResponse } from "next/server";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { programGenerateSchema } from "@/lib/api/phase5-validation";
import { getOwnedProgram } from "@/lib/api/resources";
import { createProgramGenerationJob } from "@/lib/ai/orchestrator";
import { enqueue } from "@/lib/jobs";

export const runtime = "nodejs";

export const POST = withAuthApi(async ({ request, params, session }) => {
  const programId = String(params.programId);
  await getOwnedProgram(programId, session.user.id);
  const input = await parseJson(request, programGenerateSchema);
  const job = await createProgramGenerationJob({
    userId: session.user.id,
    input,
    sourceProgramId: programId
  });

  await enqueue("program_generation", job.id);

  return NextResponse.json(
    { data: { job_id: job.id, status: job.status } },
    { status: 202 }
  );
});
