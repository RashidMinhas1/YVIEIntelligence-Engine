import { NextResponse } from "next/server";
import { JobRepository } from "@/lib/jobs/repository";
import { executeJob } from "@/lib/jobs/worker";

export async function POST(req: Request) {
  try {
    const { sections } = await req.json();

    if (!sections || sections.length === 0) {
      return NextResponse.json({ error: "No sections to analyze" }, { status: 400 });
    }

    const jobId = await JobRepository.createJob({ type: "studio_storyboard_analyze", payload: { sections } });
    
    // Start job asynchronously
    executeJob(jobId, "studio_storyboard_analyze", { sections }).catch(console.error);

    return NextResponse.json({ jobId });
  } catch (error: any) {
    console.error("[Studio Storyboard Analyze] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
