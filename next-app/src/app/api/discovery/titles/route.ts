import { withErrorHandling } from "@/lib/api-wrapper";
import { NextRequest, NextResponse } from "next/server";
import { knowledgeRepo } from "@/lib/repository";

async function GET_handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;
    const intent = searchParams.get("intent") || undefined;
    const audienceLevel = searchParams.get("audienceLevel") || undefined;

    let minConfidence: number | undefined = undefined;
    const confParam = searchParams.get("minConfidence");
    if (confParam) {
      minConfidence = parseInt(confParam, 10);
    }

    const frameworks = await knowledgeRepo.searchTitleFrameworks({
      query,
      intent,
      audienceLevel,
      minConfidence
    });

    return NextResponse.json({ data: frameworks });

  } catch (error: any) {
    console.error("[Title Framework Search] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = withErrorHandling(GET_handler);
