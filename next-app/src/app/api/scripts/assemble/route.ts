import { NextResponse } from "next/server";
import { JobManager } from "@/lib/jobs/manager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { selections, memoryProfile, topic, wordCountMode, targetWordCount, provider, objects, customPromptOverride } = body;

    const jobId = await JobManager.dispatch("scripts_assemble", {
      selections,
      memoryProfile,
      topic,
      wordCountMode,
      targetWordCount,
      provider,
      objects,
      customPromptOverride
    });

    return NextResponse.json({ jobId }, { status: 200 });
  } catch (error: any) {
    console.error("Assembly Dispatch Error:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch assemble script job." }, { status: 500 });
  }
}
