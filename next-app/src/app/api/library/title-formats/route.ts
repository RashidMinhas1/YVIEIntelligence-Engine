import { NextResponse } from "next/server";
import { getDb, titleFormatsTable } from "@/db";
import { desc } from "drizzle-orm";
import { SaveTitleFormatBody } from "@/lib/validators";
import { localDb } from "@/lib/local-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(titleFormatsTable).orderBy(desc(titleFormatsTable.createdAt));
    return NextResponse.json({ formats: rows });
  } catch (error) {
    console.warn("[Local Dev] DB connection failed. Returning local JSON library.");
    return NextResponse.json({ formats: localDb.getAll("titleFormats") });
  }
}

export async function POST(request: Request) {
  const parsed = SaveTitleFormatBody.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const db = getDb();
    const [saved] = await db.insert(titleFormatsTable).values(parsed.data).returning();
    return NextResponse.json({ format: saved });
  } catch (error) {
    console.error("[Local Dev] Database write failed. Using local JSON store.");
    const saved = localDb.insert("titleFormats", parsed.data);
    return NextResponse.json({ format: saved });
  }
}
