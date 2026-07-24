import { NextResponse } from "next/server";
import { aiRequestHistory } from "@/lib/ai/logger";
import { getAllHealth } from "@/lib/ai/health";
import { getCacheStats } from "@/lib/ai/cache";

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    history: aiRequestHistory, 
    health: getAllHealth(),
    cacheMetrics: getCacheStats()
  });
}
