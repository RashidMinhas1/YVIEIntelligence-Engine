import { NextResponse } from "next/server";
import { getAnalytics } from "@/lib/ai/analytics";
import { getAllHealth } from "@/lib/ai/health";
import { getCacheStats } from "@/lib/ai/cache";

export async function GET() {
  try {
    const analytics = getAnalytics();
    const health = getAllHealth();
    const cacheStats = getCacheStats();

    return NextResponse.json({ 
      analytics,
      health,
      cacheStats
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
