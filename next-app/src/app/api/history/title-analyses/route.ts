import { getDb, titleAnalysesTable, scriptAnalysesTable, generatedScriptsTable } from "@/db";
import { desc } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();
  const rows = await db.select().from(titleAnalysesTable).orderBy(desc(titleAnalysesTable.createdAt)).limit(20);
  return Response.json({
    analyses: rows.map((r) => ({
      id: r.id,
      titles: r.titles as string[],
      analysis: r.analysis,
      outputMode: r.outputMode,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
