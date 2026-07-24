import { NextRequest, NextResponse } from "next/server";
import { JobManager } from "@/lib/jobs/manager";

export async function POST(req: NextRequest) {
  try {
    const { moduleType, originalText, scriptContext, specificInstruction } = await req.json();

    if (!moduleType || !originalText || !scriptContext || !specificInstruction) {
      return NextResponse.json(
        { error: "Missing required optimization parameters." },
        { status: 400 }
      );
    }

    const jobId = await JobManager.dispatch("intelligence_optimize", {
      moduleType,
      originalText,
      scriptContext,
      specificInstruction
    });

    return NextResponse.json({ jobId }, { status: 200 });
  } catch (error: any) {
    console.error("Error dispatching optimization job:", error);
    return NextResponse.json(
      { error: "Failed to dispatch optimization variant.", details: error.message },
      { status: 500 }
    );
  }
}
