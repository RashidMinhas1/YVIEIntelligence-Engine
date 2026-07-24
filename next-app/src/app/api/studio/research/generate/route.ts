import { NextResponse } from "next/server";
import { JobRepository } from "@/lib/jobs/repository";
import { executeJob } from "@/lib/jobs/worker";

export async function POST(req: Request) {
  try {
    const { research } = await req.json();

    if (!research) {
      return NextResponse.json({ error: "Missing research context" }, { status: 400 });
    }

    const jobId = await JobRepository.createJob({ type: "studio_research_generate", payload: { research } });
    
    // Start job asynchronously
    executeJob(jobId, "studio_research_generate", { research }).catch(console.error);

    return NextResponse.json({ jobId });
  } catch (error: any) {
    console.error("[Studio Research Generate] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
