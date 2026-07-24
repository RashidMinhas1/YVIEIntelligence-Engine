import {
  getDb,
  videosTable,
  titleAnalysesTable,
  scriptAnalysesTable,
  generatedScriptsTable,
} from "@/db";
import { desc, sql } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const db = getDb();

  try {
    const [videoCount] = await db.select({ count: sql<number>`count(*)::int` }).from(videosTable);
    const [competitorCount] = await db.select({ count: sql<number>`count(distinct competitor)::int` }).from(videosTable);
    const [titleCount] = await db.select({ count: sql<number>`count(*)::int` }).from(titleAnalysesTable);
    const [scriptCount] = await db.select({ count: sql<number>`count(*)::int` }).from(scriptAnalysesTable);
    const [genCount] = await db.select({ count: sql<number>`count(*)::int` }).from(generatedScriptsTable);

    const recentScripts = await db
      .select({ id: generatedScriptsTable.id, title: generatedScriptsTable.title, createdAt: generatedScriptsTable.createdAt })
      .from(generatedScriptsTable)
      .orderBy(desc(generatedScriptsTable.createdAt))
      .limit(3);

    const recentAnalyses = await db
      .select({ id: titleAnalysesTable.id, createdAt: titleAnalysesTable.createdAt })
      .from(titleAnalysesTable)
      .orderBy(desc(titleAnalysesTable.createdAt))
      .limit(3);

    const activity = [
      ...recentScripts.map((s) => ({
        type: "script_generated",
        label: `Script: "${s.title.substring(0, 50)}..."`,
        createdAt: s.createdAt.toISOString(),
      })),
      ...recentAnalyses.map((a) => ({
        type: "title_analyzed",
        label: `Title analysis #${a.id}`,
        createdAt: a.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    return Response.json({
      totalVideos: videoCount.count,
      totalCompetitors: competitorCount.count,
      totalTitleAnalyses: titleCount.count,
      totalScriptAnalyses: scriptCount.count,
      totalGeneratedScripts: genCount.count,
      recentActivity: activity,
    });
  } catch (error) {
    console.warn("[Local Dev] DB connection failed. Returning mock dashboard stats.", error);
    return Response.json({
      totalVideos: 120,
      totalCompetitors: 5,
      totalTitleAnalyses: 14,
      totalScriptAnalyses: 8,
      totalGeneratedScripts: 3,
      recentActivity: [
        { type: "script_generated", label: "Script: Mock Generated Script...", createdAt: new Date().toISOString() },
        { type: "title_analyzed", label: "Title analysis #mock", createdAt: new Date(Date.now() - 3600000).toISOString() },
      ],
    });
  }
}
