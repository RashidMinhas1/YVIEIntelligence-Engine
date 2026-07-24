import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getAISettings } from "@/lib/ai/settings";
import { isMaskedKey } from "@/lib/encryption";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider, config } = body;

    let realApiKey = config?.apiKey;
    if (isMaskedKey(realApiKey) || !realApiKey) {
       const savedSettings = getAISettings();
       if (provider === "openai") realApiKey = savedSettings.providers?.openai?.apiKey;
       else if (provider === "gemini") realApiKey = savedSettings.providers?.gemini?.apiKey;
       else if (provider === "openrouter") realApiKey = savedSettings.providers?.openrouter?.apiKey;
    }

    if (!realApiKey) {
       return NextResponse.json({ success: false, error: "No API key found for provider." });
    }

    let models = [];

    if (provider === "openai") {
      const client = new OpenAI({ apiKey: realApiKey, baseURL: config?.baseUrl || "https://api.openai.com/v1" });
      const response = await client.models.list();
      models = response.data.map((m: any) => ({
        id: m.id,
        name: m.id,
        provider: "openai",
        isFree: false
      }));
    } else if (provider === "gemini") {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${realApiKey}`);
      if (!response.ok) {
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      models = (data.models || [])
        .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
        .map((m: any) => ({
          id: m.name.replace("models/", ""),
          name: m.displayName || m.name,
          provider: "gemini",
          contextWindow: m.inputTokenLimit,
          isFree: false
        }));
    } else if (provider === "openrouter") {
      const response = await fetch("https://openrouter.ai/api/v1/models");
      if (!response.ok) {
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      models = (data.data || []).map((m: any) => {
        const isFree = m.pricing?.prompt === "0" && m.pricing?.completion === "0";
        return {
          id: m.id,
          name: m.name,
          provider: "openrouter",
          contextWindow: m.context_length,
          pricing: m.pricing,
          isFree
        };
      });
    } else {
      throw new Error("Invalid provider");
    }

    const { getHealth } = await import("@/lib/ai/health");
    models = models.map((m: any) => {
      const h = getHealth(provider, m.id);
      const successRate = h.successCount + h.failureCount === 0 ? 1 : h.successCount / (h.successCount + h.failureCount);
      const avgResponseTimeMs = h.successCount === 0 ? null : h.totalResponseTimeMs / h.successCount;
      const isHealthy = h.unhealthyUntil < Date.now();
      return {
        ...m,
        health: {
          successRate,
          avgResponseTimeMs,
          timeoutCount: h.timeoutCount,
          isHealthy
        }
      };
    });

    return NextResponse.json({ success: true, models });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
