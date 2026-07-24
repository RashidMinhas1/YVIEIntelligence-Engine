import { NextResponse } from "next/server";
import { JobManager } from "@/lib/jobs/manager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { text, categoryId, originalScriptContext, title } = await request.json();

    if (!text || !categoryId) {
      return NextResponse.json({ error: "Missing text or categoryId" }, { status: 400 });
    }

    const jobId = await JobManager.dispatch("knowledge_extract", {
      text,
      categoryId,
      originalScriptContext,
      title
    });

    return NextResponse.json({ jobId }, { status: 200 });
  } catch (error: any) {
    console.error("Extraction error:", error);
    return NextResponse.json({ error: "Failed to dispatch knowledge extraction job", details: error.message }, { status: 500 });
  }
}
