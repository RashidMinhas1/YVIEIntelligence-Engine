import { NextRequest, NextResponse } from "next/server";
import { translationService } from "@/lib/translation/service";
import { TranslationRequest, TranslationMode, ContentType } from "@/lib/translation/translation";

const VALID_MODES: TranslationMode[] = ["literal", "natural", "professional", "creator", "localization"];
const VALID_CONTENT_TYPES: ContentType[] = [
  "title", "hook", "opening", "script", "cta", "ending", "shorts_script",
  "community_post", "description", "seo_tags", "chapters", "thumbnail_text",
  "voice_over", "ai_prompt", "research_notes", "intelligence_report",
  "strategy_report", "markdown_document", "rich_text", "plain_text", "knowledge_content"
];
const MAX_CONTENT_LENGTH = 50_000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<TranslationRequest>;

    // Validation
    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json({ error: "content is required and must be a string" }, { status: 400 });
    }
    if (body.content.length > MAX_CONTENT_LENGTH) {
      return NextResponse.json(
        { error: `content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters` },
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
    if (!body.contentType || !VALID_CONTENT_TYPES.includes(body.contentType)) {
      return NextResponse.json(
        { error: `contentType must be one of: ${VALID_CONTENT_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Resolve user ID from session cookie or default to system user
    const userId = request.cookies.get("user_id")?.value ?? "anonymous";

    const translationRequest: TranslationRequest = {
      content: body.content,
      sourceLanguage: body.sourceLanguage ?? "auto",
      targetLanguage: body.targetLanguage,
      mode: body.mode,
      contentType: body.contentType,
      glossaryId: body.glossaryId,
      preserveBrandNames: body.preserveBrandNames ?? true,
      preserveFormatting: body.preserveFormatting ?? true,
      preserveUrls: body.preserveUrls ?? true,
      preserveNumbers: body.preserveNumbers ?? true,
    };

    const result = await translationService.translate(translationRequest, userId);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Translation failed";
    console.error("[Translation API] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
