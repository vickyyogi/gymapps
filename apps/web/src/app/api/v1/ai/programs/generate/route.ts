import { NextResponse } from "next/server";
import { after } from "next/server";
import { withAuthApi, parseJson } from "@/lib/api/handler";
import { programGenerateSchema } from "@/lib/api/phase5-validation";
import {
  createProgramGenerationJob,
  runProgramGeneration
} from "@/lib/ai/orchestrator";

export const runtime = "nodejs";

const STEPS = ["analyzing_profile", "drafting_program", "validating", "finalizing"];

export const POST = withAuthApi(async ({ request, session }) => {
  const input = await parseJson(request, programGenerateSchema);
  const job = await createProgramGenerationJob({ userId: session.user.id, input });

  after(() => runProgramGeneration(job.id));

  return NextResponse.json(
    {
      data: {
        job_id: job.id,
        status: job.status,
        steps: STEPS
      }
    },
    { status: 202 }
  );
});
