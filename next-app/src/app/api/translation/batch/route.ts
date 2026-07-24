import { NextRequest, NextResponse } from "next/server";
import { translationService } from "@/lib/translation/service";
import { BatchTranslationRequest, TranslationMode, ContentType } from "@/lib/translation/translation";

const VALID_MODES: TranslationMode[] = ["literal", "natural", "professional", "creator", "localization"];
const MAX_BATCH_ITEMS = 20;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<BatchTranslationRequest>;

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json({ error: "items array is required" }, { status: 400 });
    }
    if (body.items.length === 0) {
      return NextResponse.json({ error: "items array cannot be empty" }, { status: 400 });
    }
    if (body.items.length > MAX_BATCH_ITEMS) {
      return NextResponse.json(
        { error: `Batch size cannot exceed ${MAX_BATCH_ITEMS} items` },
        { status: 400 }
      );
    }
    if (!body.targetLanguage || typeof body.targetLanguage !== "string") {
      return NextResponse.json({ error: "targetLanguage is required" }, { status: 400 });
    }
    if (!body.mode || !VALID_MODES.includes(body.mode)) {
      return NextResponse.json(
        { error: `mode must be one of: ${VALID_MODES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate each item
    for (const item of body.items) {
      if (!item.id || typeof item.id !== "string") {
        return NextResponse.json({ error: "Each item must have a string id" }, { status: 400 });
      }
      if (!item.content || typeof item.content !== "string") {
        return NextResponse.json({ error: `Item "${item.id}" is missing content` }, { status: 400 });
      }
      if (!item.contentType) {
        return NextResponse.json({ error: `Item "${item.id}" is missing contentType` }, { status: 400 });
      }
    }

    const userId = request.cookies.get("user_id")?.value ?? "anonymous";

    const batchRequest: BatchTranslationRequest = {
      items: body.items.map((item) => ({
        id: item.id,
        content: item.content,
        contentType: item.contentType as ContentType,
      })),
      sourceLanguage: body.sourceLanguage ?? "auto",
      targetLanguage: body.targetLanguage,
      mode: body.mode,
      glossaryId: body.glossaryId,
      preserveBrandNames: body.preserveBrandNames ?? true,
      preserveFormatting: body.preserveFormatting ?? true,
      preserveUrls: body.preserveUrls ?? true,
      preserveNumbers: body.preserveNumbers ?? true,
    };

    const result = await translationService.translateBatch(batchRequest, userId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Batch translation failed";
    console.error("[Batch Translation API] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
