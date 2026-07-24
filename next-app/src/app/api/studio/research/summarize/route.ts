import { NextResponse } from "next/server";
import { JobRepository } from "@/lib/jobs/repository";
import { executeJob } from "@/lib/jobs/worker";

export async function POST(req: Request) {
  try {
    const { source } = await req.json();

    if (!source) {
      return NextResponse.json({ error: "Missing source" }, { status: 400 });
    }

    const jobId = await JobRepository.createJob({ type: "studio_research_summarize", payload: { source } });
    
    // Start job asynchronously
    executeJob(jobId, "studio_research_summarize", { source }).catch(console.error);

    return NextResponse.json({ jobId });
  } catch (error: any) {
    console.error("[Studio Research Summarize] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
