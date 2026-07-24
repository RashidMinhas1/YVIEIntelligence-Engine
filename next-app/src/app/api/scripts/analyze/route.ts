import { NextResponse } from "next/server";
import { JobManager } from "@/lib/jobs/manager";
import { AnalyzeScriptBody } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = AnalyzeScriptBody.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const jobId = await JobManager.dispatch("scripts_analyze", parsed.data);
    return NextResponse.json({ jobId }, { status: 200 });
  } catch (error: any) {
    console.error("Dispatch Error:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch script analysis." }, { status: 500 });
  }
}
