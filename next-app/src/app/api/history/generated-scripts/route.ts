import { getDb, generatedScriptsTable } from "@/db";
import { desc } from "drizzle-orm";
import { localDb } from "@/lib/local-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = getDb();
    const rows = await db.select().from(generatedScriptsTable).orderBy(desc(generatedScriptsTable.createdAt)).limit(20);
    return Response.json({
      scripts: rows.map((r) => ({
        id: r.id,
        title: r.title,
        script: r.script,
        wordCount: r.wordCount,
        outputMode: r.outputMode,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.warn("[Local Dev] DB connection failed. Returning local JSON history.");
    return Response.json({ scripts: localDb.getAll("generatedScripts") });
  }
}
