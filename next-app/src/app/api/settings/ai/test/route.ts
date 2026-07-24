import { NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AITestConnectionSchema } from "@/lib/validators";
import { getAISettings } from "@/lib/ai/settings";
import { isMaskedKey } from "@/lib/encryption";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = AITestConnectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid request body", details: parsed.error.format() });
    }

    const { provider, config } = parsed.data;
    
    // Resolve the real API key if it was masked by the frontend
    let realApiKey = config.apiKey;
    if (isMaskedKey(realApiKey) || !realApiKey) {
       const savedSettings = getAISettings();
       if (provider === "openai") realApiKey = savedSettings.providers?.openai?.apiKey;
       else if (provider === "gemini") realApiKey = savedSettings.providers?.gemini?.apiKey;
       else if (provider === "openrouter") realApiKey = savedSettings.providers?.openrouter?.apiKey;
    }
    
    if (!realApiKey) {
       return NextResponse.json({ success: false, error: "No API key found for provider." });
    }
    
    if (provider === "openai") {
      const client = new OpenAI({ apiKey: realApiKey, baseURL: config.baseUrl || "https://api.openai.com/v1" });
      await client.chat.completions.create({ model: config.model || "gpt-4o-mini", max_tokens: 10, messages: [{ role: "user", content: "Reply OK" }] });
    } else if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(realApiKey);
      const model = genAI.getGenerativeModel({ model: config.model || "gemini-1.5-flash" });
      await model.generateContent({ contents: [{ role: "user", parts: [{ text: "Reply OK" }] }], generationConfig: { maxOutputTokens: 10 } });
    } else if (provider === "openrouter") {
      const client = new OpenAI({ apiKey: realApiKey, baseURL: config.baseUrl || "https://openrouter.ai/api/v1" });
      await client.chat.completions.create({ model: config.model || "openrouter/auto", max_tokens: 10, messages: [{ role: "user", content: "Reply OK" }] });
    } else {
      throw new Error("Invalid provider");
    }

    return NextResponse.json({ success: true, message: "Connection successful" });
  } catch (err: any) {
    let errorStr = err.message || "Unknown error";
    const status = err.status || err.response?.status;
    
    if (status === 401 || status === 403) errorStr = "Invalid API Key: " + err.message;
    else if (status === 402) errorStr = "Payment Required: " + err.message;
    else if (status === 404 || err.message?.includes("404 Not Found") || err.message?.includes("is not found")) errorStr = "Model Not Found: " + err.message;
    else if (status === 429) errorStr = "Rate Limited: " + err.message;
    else if (err.name === "AbortError" || err.name === "TimeoutError" || err.message?.includes("aborted")) errorStr = "Timeout: " + err.message;
    else if (err.type === "system" || err.message?.includes("fetch failed")) errorStr = "Provider Offline: " + err.message;

    return NextResponse.json({ success: false, error: errorStr });
  }
}
