import { NextRequest, NextResponse } from "next/server";
import { translationService } from "@/lib/translation/service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { text?: string };

    if (!body.text || typeof body.text !== "string") {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    if (body.text.trim().length === 0) {
      return NextResponse.json({ error: "text cannot be empty" }, { status: 400 });
    }
    // Limit detection input to avoid unnecessary token usage
    if (body.text.length > 2000) {
      return NextResponse.json(
        { error: "text for detection must be 2000 characters or fewer" },
        { status: 400 }
      );
    }

    const result = await translationService.detectLanguage(body.text);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Language detection failed";
    console.error("[Language Detection API] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
