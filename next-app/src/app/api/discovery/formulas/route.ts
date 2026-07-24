import { withErrorHandling } from "@/lib/api-wrapper";
import { NextRequest, NextResponse } from "next/server";
import { knowledgeRepo } from "@/lib/repository";

async function GET_handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;
    const category = searchParams.get("category") || undefined;
    
    let tags: string[] | undefined = undefined;
    const tagsParam = searchParams.get("tags");
    if (tagsParam) {
      tags = tagsParam.split(",");
    }

    let minConfidence: number | undefined = undefined;
    const confParam = searchParams.get("minConfidence");
    if (confParam) {
      minConfidence = parseInt(confParam, 10);
    }

    const formulas = await knowledgeRepo.searchFormulas({
      query,
      category,
      tags,
      minConfidence
    });

    return NextResponse.json({ data: formulas });

  } catch (error: any) {
    console.error("[Viral Formula Search] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = withErrorHandling(GET_handler);
