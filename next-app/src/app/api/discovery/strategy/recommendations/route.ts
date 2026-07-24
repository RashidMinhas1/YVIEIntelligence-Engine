import { withErrorHandling } from "@/lib/api-wrapper";
import { NextResponse } from "next/server";
import { knowledgeRepo } from "@/lib/repository";

async function GET_handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const minPriority = searchParams.get("minPriority") ? parseInt(searchParams.get("minPriority") as string) : undefined;

    const recommendations = await knowledgeRepo.searchRecommendations({
      category,
      minPriority
    });

    return NextResponse.json({ success: true, recommendations });
  } catch (err: any) {
    console.error("Recommendations Fetch Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const GET = withErrorHandling(GET_handler);
