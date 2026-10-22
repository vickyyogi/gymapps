import { NextResponse, after } from "next/server";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { programGenerateSchema } from "@/lib/api/phase5-validation";
import { getOwnedProgram } from "@/lib/api/resources";
import {
  createProgramGenerationJob,
  runProgramGeneration
} from "@/lib/ai/orchestrator";

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

  after(() => runProgramGeneration(job.id));

  return NextResponse.json(
    { data: { job_id: job.id, status: job.status } },
    { status: 202 }
  );
});
