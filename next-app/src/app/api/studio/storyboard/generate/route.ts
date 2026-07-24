import { NextResponse } from "next/server";
import { JobRepository } from "@/lib/jobs/repository";
import { executeJob } from "@/lib/jobs/worker";

export async function POST(req: Request) {
  try {
    const { action, sections, research } = await req.json();

    if (!action || !sections) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const jobId = await JobRepository.createJob({ type: "studio_storyboard_generate", payload: { action, sections, research } });
    
    // Start job asynchronously
    executeJob(jobId, "studio_storyboard_generate", { action, sections, research }).catch(console.error);

    return NextResponse.json({ jobId });
  } catch (error: any) {
    console.error("[Studio Storyboard Generate] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
