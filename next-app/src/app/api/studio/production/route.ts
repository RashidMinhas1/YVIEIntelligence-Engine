import { NextResponse } from "next/server";
import { JobRepository } from "@/lib/jobs/repository";
import { executeJob } from "@/lib/jobs/worker";

export async function POST(req: Request) {
  try {
    const { action, projectId, sections, production, thumbnail, scriptContext } = await req.json();

    if (!action) {
      return NextResponse.json({ error: "Missing required action" }, { status: 400 });
    }

    const jobTypeMap: Record<string, string> = {
      "analyze_production": "studio_analyze_production",
      "generate_thumbnail": "studio_generate_thumbnail",
      "generate_thumbnail_prompt": "studio_generate_thumbnail_prompt",
      "analyze_thumbnail_quality": "studio_analyze_thumbnail_quality",
      "generate_thumbnail_preview": "studio_generate_thumbnail_preview",
      "generate_titles": "studio_generate_titles",
      "generate_description": "studio_generate_description",
      "generate_tags": "studio_generate_tags",
      "generate_chapters": "studio_generate_chapters",
      "generate_checklist": "studio_generate_checklist",
    };

    const jobType = jobTypeMap[action];
    if (!jobType) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const payload = { action, projectId, sections, production, thumbnail, scriptContext };
    const jobId = await JobRepository.createJob({ type: jobType, payload });
    
    // Start job asynchronously
    executeJob(jobId, jobType, payload).catch(console.error);

    return NextResponse.json({ jobId });
  } catch (error: any) {
    console.error("[Studio Production] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
