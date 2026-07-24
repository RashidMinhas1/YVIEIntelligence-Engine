import { withErrorHandling } from "@/lib/api-wrapper";
import { NextResponse } from "next/server";
import { knowledgeRepo } from "@/lib/repository";

async function GET_handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const minSynergyScore = searchParams.get("minSynergyScore") ? parseInt(searchParams.get("minSynergyScore") as string) : undefined;

    const synergyFrameworks = await knowledgeRepo.searchSynergyFrameworks({
      query,
      minSynergyScore
    });

    return NextResponse.json({ success: true, synergyFrameworks });
  } catch (err: any) {
    console.error("Synergy Framework Fetch Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const GET = withErrorHandling(GET_handler);
