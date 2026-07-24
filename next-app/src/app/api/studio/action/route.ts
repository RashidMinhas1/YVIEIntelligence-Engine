import { NextResponse } from "next/server";
import { JobManager } from "@/lib/jobs/manager";
import { z } from "zod";

const payloadSchema = z.object({
  action: z.string(),
  sectionType: z.string(),
  currentContent: z.string().optional(),
  promptInstruction: z.string().optional(),
  fullScriptContext: z.string().optional()
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const payload = payloadSchema.parse(json);

    const jobId = await JobManager.dispatch("studio_ai_task", payload);
    return NextResponse.json({ jobId });
  } catch (error: any) {
    console.error("[Studio Action API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
