import { NextResponse } from "next/server";
import { GenerateTitlesBody } from "@/lib/validators";
import { callAI } from "@/lib/ai";
import { buildTitleGeneratePrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const parsed = GenerateTitlesBody.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { analysis, niche, outputMode, customGeneratePrompt, libraryFormat } = parsed.data;
  const prompt = buildTitleGeneratePrompt(analysis, niche, customGeneratePrompt, libraryFormat);
  const result = await callAI(prompt, { mode: outputMode, responseFormat: "json_object" });

  let titles: string[] = [];
  let explanation = "";

  try {
    const cleanResult = result.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const data = JSON.parse(cleanResult);
    titles = data.data?.generatedTitles || [];
    if (data.data?.strongestTitle) titles.unshift(data.data.strongestTitle);
    if (data.data?.powerVariations) titles.push(...data.data.powerVariations);
    
    // Deduplicate
    titles = Array.from(new Set(titles)).slice(0, 5);
    explanation = data.data?.explanations?.join("\n\n") || "";
  } catch (e) {
    console.error("Failed to parse title generation JSON", e);
    // fallback
    const lines = result.split("\n").filter((l) => l.trim());
    const titleLines = lines.filter((l) => /^\d+[.)]\s/.test(l.trim())).slice(0, 5);
    titles = titleLines.length >= 3
        ? titleLines.map((l) => l.replace(/^\d+[.)]\s*/, "").replace(/\s*—.*$/, "").replace(/\*\*/g, "").trim())
        : lines.filter((l) => l.trim().length > 20 && l.trim().length < 120).slice(0, 5);
    explanation = result;
  }

  return NextResponse.json({
    titles: titles.length >= 3 ? titles : ["See full response below"],
    explanation: result,
  });
}
