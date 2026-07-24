import { NextResponse } from "next/server";
import { KnowledgeObject } from "@/lib/types/knowledge-object";
import { detectConflictsPhase1 } from "@/lib/assembly/engine";
import { callAI } from "@/lib/ai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { objects } = await request.json() as { objects: KnowledgeObject[] };
    
    // Phase 1: Rules-based (fast, free)
    let warnings = detectConflictsPhase1(objects);

    // Phase 2: AI Fallback (only if we suspect nuanced conflicts but rules missed them)
    // For MVP, we will run Phase 2 if there are many objects but no rule hits (low confidence).
    if (objects.length > 3 && warnings.length === 0) {
      const summary = objects.map(o => `[${o.category}] ${o.title}: ${o.extractedContent}`).join("\n");
      const prompt = `Analyze these selected YouTube script components for severe thematic or pacing conflicts.
Components:
${summary}

Return ONLY a JSON array of conflict objects. Format:
[{"severity": "high", "message": "explanation", "objectsInvolved": []}]
If no severe conflicts exist, return [].`;

      try {
        const aiResponse = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
        const parsed = JSON.parse(aiResponse.replace(/^```[a-z]*\n/i, "").replace(/\n```$/i, "").trim());
        if (Array.isArray(parsed) && parsed.length > 0) {
          warnings = [...warnings, ...parsed];
        } else if (parsed && Array.isArray(parsed.conflicts)) {
          warnings = [...warnings, ...parsed.conflicts];
        }
      } catch (e) {
        // Fallback to empty if AI fails to parse
      }
    }

    return NextResponse.json({ warnings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
