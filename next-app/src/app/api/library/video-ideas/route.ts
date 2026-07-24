import { NextResponse } from "next/server";
import { getDb, videoIdeasTable } from "@/db";
import { desc, eq } from "drizzle-orm";
import { SaveVideoIdeaBody } from "@/lib/validators";
import { localDb } from "@/lib/local-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(videoIdeasTable).orderBy(desc(videoIdeasTable.createdAt));
    return NextResponse.json({ ideas: rows });
  } catch (error) {
    console.warn("[Local Dev] DB connection failed. Returning local JSON video ideas.");
    return NextResponse.json({ ideas: localDb.getAll("videoIdeas") });
  }
}

export async function POST(request: Request) {
  const parsed = SaveVideoIdeaBody.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const db = getDb();
    const id = "v" + Date.now();
    const [saved] = await db
      .insert(videoIdeasTable)
      .values({
        id,
        name: parsed.data.name,
        selectedTitleFormatId: parsed.data.selectedTitleFormatId ?? null,
        editedTitle: parsed.data.editedTitle ?? null,
        selectedScriptFormatId: parsed.data.selectedScriptFormatId ?? null,
        editedScript: parsed.data.editedScript ?? null,
        notes: parsed.data.notes,
        metadata: parsed.data.metadata ?? null,
      })
      .returning();

    return NextResponse.json({ idea: saved });
  } catch (error) {
    console.error("[Local Dev] Database write failed. Using local JSON store.", error);
    const id = "v" + Date.now();
    const newIdea = {
      id,
      name: parsed.data.name,
      selectedTitleFormatId: parsed.data.selectedTitleFormatId ?? null,
      editedTitle: parsed.data.editedTitle ?? null,
      selectedScriptFormatId: parsed.data.selectedScriptFormatId ?? null,
      editedScript: parsed.data.editedScript ?? null,
      notes: parsed.data.notes,
      metadata: parsed.data.metadata ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const ldb = localDb.getDb();
    ldb.videoIdeas = ldb.videoIdeas || [];
    ldb.videoIdeas.unshift(newIdea);
    localDb.saveDb(ldb);
    
    return NextResponse.json({ idea: newIdea });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Missing idea ID" }, { status: 400 });
    }

    try {
      const db = getDb();
      await db.delete(videoIdeasTable).where(eq(videoIdeasTable.id, id));
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.warn("[Local Dev] DB connection failed. Falling back to local JSON store for DELETE.", dbError);
      const ldb = localDb.getDb();
      if (ldb.videoIdeas) {
        ldb.videoIdeas = ldb.videoIdeas.filter((item: any) => item.id !== id);
        localDb.saveDb(ldb);
      }
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete idea" }, { status: 500 });
  }
}
