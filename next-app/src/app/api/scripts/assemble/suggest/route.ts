import { NextResponse } from "next/server";
import { getDb, libraryItemsTable } from "@/db";
import { eq, desc } from "drizzle-orm";
import { KnowledgeObject } from "@/lib/types/knowledge-object";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let category: string;
  try {
    const body = await request.json();
    category = body.category;
  } catch (err) {
    return NextResponse.json({ suggestions: [] });
  }

  if (!category) return NextResponse.json({ suggestions: [] });

  try {
    const db = getDb();
    const items = await db.select().from(libraryItemsTable);
    
    const suggestions = items
      .map(item => item.content as unknown as KnowledgeObject)
      .filter(c => c && c.category === category)
      .sort((a, b) => (b.scores?.usefulnessScore || 0) - (a.scores?.usefulnessScore || 0))
      .slice(0, 3);

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.warn("[Local Dev] DB connection failed. Using local DB.");
    const { localDb } = await import("@/lib/local-db");
    const items = localDb.getAll("libraryItems");
    const suggestions = items
      .map((item: any) => item.content)
      .filter((c: any) => c && c.category === category)
      .sort((a: any, b: any) => (b.scores?.usefulnessScore || 0) - (a.scores?.usefulnessScore || 0))
      .slice(0, 3);
    
    return NextResponse.json({ suggestions });
  }
}
