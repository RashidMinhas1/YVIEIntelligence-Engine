import { withErrorHandling } from "@/lib/api-wrapper";
import { NextResponse } from "next/server";
import { knowledgeRepo } from "@/lib/repository";

async function GET_handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId") || undefined;

    const strategies = await knowledgeRepo.searchStrategicIntelligence({
      channelId
    });

    return NextResponse.json({ success: true, strategies });
  } catch (err: any) {
    console.error("Roadmaps Fetch Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const GET = withErrorHandling(GET_handler);
