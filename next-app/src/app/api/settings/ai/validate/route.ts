import { NextResponse } from "next/server";
import { fetchAllProviderModels } from "@/lib/ai/router";

export async function POST(req: Request) {
  try {
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return NextResponse.json({ valid: false, error: "Provider and API Key required" }, { status: 400 });
    }

    const startTime = Date.now();
    const models = await fetchAllProviderModels(provider, apiKey, true);
    const latency = Date.now() - startTime;

    if (models.length > 0) {
      return NextResponse.json({ 
        valid: true, 
        latencyMs: latency, 
        modelsCount: models.length 
      });
    } else {
      return NextResponse.json({ 
        valid: false, 
        error: "Invalid API Key or Quota Exhausted" 
      });
    }
  } catch (error: any) {
    return NextResponse.json({ valid: false, error: error.message }, { status: 500 });
  }
}
