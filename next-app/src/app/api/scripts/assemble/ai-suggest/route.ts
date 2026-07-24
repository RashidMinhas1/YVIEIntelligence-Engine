import { NextResponse } from "next/server";
import { callAI } from "@/lib/ai";
import { KNOWLEDGE_CATEGORIES } from "@/lib/config/knowledge-categories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { topic, categoryId } = await req.json();
    
    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const categoryConfig = KNOWLEDGE_CATEGORIES.find(c => c.id === categoryId);
    if (!categoryConfig) throw new Error("Invalid category");

    const schemaFields: Record<string, string> = {};
    for (const field of categoryConfig.fields) {
      schemaFields[field.id] = field.type === "number" ? "number" : "string";
    }

    const systemPrompt = `You are an elite YouTube Strategist. Generate a highly engaging, custom-tailored Knowledge Object for the category "${categoryConfig.label}".
The topic of the video is: "${topic}"

Your task is to write content that perfectly matches the intent and tone of the topic.
You must output STRICT JSON matching this exact structure:
${JSON.stringify({ 
  generatedTitle: `A concise, catchy title for this ${categoryConfig.label}`, 
  content: schemaFields 
}, null, 2)}`;

    const rawResponse = await callAI(`Generate a ${categoryConfig.label} for the topic: ${topic}`, { mode: "text", systemPrompt, responseFormat: "json_object" });
    const cleanResponse = rawResponse.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const result = JSON.parse(cleanResponse);

    const suggestion = {
      id: crypto.randomUUID(),
      title: result.generatedTitle || `AI Suggested ${categoryConfig.label}`,
      type: categoryId,
      content: result.content,
      isAiGenerated: true
    };

    return NextResponse.json({ suggestion });
  } catch (error: any) {
    console.error("[AI Suggest Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
