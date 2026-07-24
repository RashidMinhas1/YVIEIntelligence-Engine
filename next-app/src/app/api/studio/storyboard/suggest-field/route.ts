import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai";
import { buildFieldSuggestPrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { scriptChunk, fieldToSuggest, globalTheme } = body;

    if (!scriptChunk || !fieldToSuggest) {
      return NextResponse.json({ error: "Missing required fields: scriptChunk and fieldToSuggest" }, { status: 400 });
    }

    const prompt = buildFieldSuggestPrompt(scriptChunk, fieldToSuggest, globalTheme);
    
    // We request raw text, not JSON, because the prompt explicitly asks for raw text output.
    const rawResponse = await callAI(prompt, { mode: "text", responseFormat: "text" });

    const cleanResponse = rawResponse.trim();

    return NextResponse.json({ suggestion: cleanResponse });
  } catch (error: any) {
    console.error("Field suggestion failed:", error);
    return NextResponse.json(
      { error: "Failed to generate field suggestion", details: error.message },
      { status: 500 }
    );
  }
}
