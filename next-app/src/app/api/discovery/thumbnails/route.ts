import { withErrorHandling } from "@/lib/api-wrapper";
import { NextRequest, NextResponse } from "next/server";
import { knowledgeRepo } from "@/lib/repository";

async function GET_handler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || undefined;
    const primaryEmotion = searchParams.get("primaryEmotion") || undefined;

    let minCtrStrength: number | undefined = undefined;
    const ctrParam = searchParams.get("minCtrStrength");
    if (ctrParam) {
      minCtrStrength = parseInt(ctrParam, 10);
    }

    const frameworks = await knowledgeRepo.searchThumbnailFrameworks({
      query,
      primaryEmotion,
      minCtrStrength
    });

    return NextResponse.json({ data: frameworks });

  } catch (error: any) {
    console.error("[Thumbnail Framework Search] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = withErrorHandling(GET_handler);
