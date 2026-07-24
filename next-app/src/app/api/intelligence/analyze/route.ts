import { NextRequest, NextResponse } from "next/server";
import { JobManager } from "@/lib/jobs/manager";

export async function POST(req: NextRequest) {
  try {
    const { scriptContent, videoTitle } = await req.json();

    if (!scriptContent) {
      return NextResponse.json(
        { error: "scriptContent is required" },
        { status: 400 }
      );
    }

    const jobId = await JobManager.dispatch("intelligence_analyze", { scriptContent, videoTitle });

    return NextResponse.json({ jobId }, { status: 200 });
  } catch (error: any) {
    console.error("Error dispatching script analysis job:", error);
    return NextResponse.json(
      { error: "Failed to dispatch job.", details: error.message },
      { status: 500 }
    );
  }
}
