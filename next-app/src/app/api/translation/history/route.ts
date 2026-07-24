import { NextRequest, NextResponse } from "next/server";
import { translationService } from "@/lib/translation/service";
import { TranslationHistoryFilters, TranslationMode, ContentType } from "@/lib/translation/translation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = request.cookies.get("user_id")?.value ?? "anonymous";

    const filters: TranslationHistoryFilters = {
      userId,
      sourceLanguage: searchParams.get("sourceLanguage") ?? undefined,
      targetLanguage: searchParams.get("targetLanguage") ?? undefined,
      mode: (searchParams.get("mode") as TranslationMode) ?? undefined,
      contentType: (searchParams.get("contentType") as ContentType) ?? undefined,
      fromDate: searchParams.get("fromDate") ?? undefined,
      toDate: searchParams.get("toDate") ?? undefined,
      limit: searchParams.has("limit") ? parseInt(searchParams.get("limit")!, 10) : 50,
      offset: searchParams.has("offset") ? parseInt(searchParams.get("offset")!, 10) : 0,
    };

    const history = await translationService.getHistory(filters);
    return NextResponse.json({ history, count: history.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch history";
    console.error("[Translation History API] GET Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await translationService.deleteHistory(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete history entry";
    console.error("[Translation History API] DELETE Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
