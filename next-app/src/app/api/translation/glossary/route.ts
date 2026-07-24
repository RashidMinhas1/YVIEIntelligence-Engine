import { NextRequest, NextResponse } from "next/server";
import { translationService } from "@/lib/translation/service";
import { GlossaryEntry, GlossaryFilters } from "@/lib/translation/translation";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const filters: GlossaryFilters = {
      sourceLanguage: searchParams.get("sourceLanguage") ?? undefined,
      targetLanguage: searchParams.get("targetLanguage") ?? undefined,
      query: searchParams.get("query") ?? undefined,
    };

    const glossary = await translationService.getGlossary(filters);
    return NextResponse.json({ glossary, count: glossary.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch glossary";
    console.error("[Glossary API] GET Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<Omit<GlossaryEntry, "id" | "createdAt" | "updatedAt">>;

    if (!body.sourceTerm || typeof body.sourceTerm !== "string") {
      return NextResponse.json({ error: "sourceTerm is required" }, { status: 400 });
    }
    if (!body.targetTerm || typeof body.targetTerm !== "string") {
      return NextResponse.json({ error: "targetTerm is required" }, { status: 400 });
    }
    if (!body.sourceLanguage || typeof body.sourceLanguage !== "string") {
      return NextResponse.json({ error: "sourceLanguage is required" }, { status: 400 });
    }
    if (!body.targetLanguage || typeof body.targetLanguage !== "string") {
      return NextResponse.json({ error: "targetLanguage is required" }, { status: 400 });
    }

    const entry = await translationService.saveGlossaryEntry({
      sourceTerm: body.sourceTerm,
      targetTerm: body.targetTerm,
      sourceLanguage: body.sourceLanguage,
      targetLanguage: body.targetLanguage,
      notes: body.notes,
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save glossary entry";
    console.error("[Glossary API] POST Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as Partial<GlossaryEntry> & { id: string };

    if (!body.id || typeof body.id !== "string") {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const { id, ...updates } = body;
    const updated = await translationService.updateGlossaryEntry(id, updates);
    return NextResponse.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update glossary entry";
    console.error("[Glossary API] PUT Error:", message);
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

    await translationService.deleteGlossaryEntry(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete glossary entry";
    console.error("[Glossary API] DELETE Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
