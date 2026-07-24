import { getDb, scriptAnalysesTable } from "@/db";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(scriptAnalysesTable).orderBy(desc(scriptAnalysesTable.createdAt)).limit(20);
  return Response.json({
    analyses: rows.map((r) => ({
      id: r.id,
      scriptPreview: r.scriptPreview,
      analysis: r.analysis,
      outputMode: r.outputMode,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
