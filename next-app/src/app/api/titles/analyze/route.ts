import { NextResponse } from "next/server";
import { JobManager } from "@/lib/jobs/manager";
import { AnalyzeTitlesBody } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const parsed = AnalyzeTitlesBody.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const jobId = await JobManager.dispatch("titles_analyze", parsed.data);
    return NextResponse.json({ jobId }, { status: 200 });
  } catch (error: any) {
    console.error("Dispatch Error:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch titles analysis." }, { status: 500 });
  }
}
