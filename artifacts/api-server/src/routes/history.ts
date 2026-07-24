import { Router } from "express";
import { db } from "@workspace/db";
import { titleAnalysesTable, scriptAnalysesTable, generatedScriptsTable, videosTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";

const router = Router();

router.get("/title-analyses", async (_req, res) => {
  const rows = await db.select().from(titleAnalysesTable).orderBy(desc(titleAnalysesTable.createdAt)).limit(20);
  return res.json({
    analyses: rows.map((r) => ({
      id: r.id,
      titles: r.titles as string[],
      analysis: r.analysis,
      outputMode: r.outputMode,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

router.get("/script-analyses", async (_req, res) => {
  const rows = await db.select().from(scriptAnalysesTable).orderBy(desc(scriptAnalysesTable.createdAt)).limit(20);
  return res.json({
    analyses: rows.map((r) => ({
      id: r.id,
      scriptPreview: r.scriptPreview,
      analysis: r.analysis,
      outputMode: r.outputMode,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

router.get("/generated-scripts", async (_req, res) => {
  const rows = await db.select().from(generatedScriptsTable).orderBy(desc(generatedScriptsTable.createdAt)).limit(20);
  return res.json({
    scripts: rows.map((r) => ({
      id: r.id,
      title: r.title,
      script: r.script,
      wordCount: r.wordCount,
      outputMode: r.outputMode,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

router.get("/dashboard", async (_req, res) => {
  const [videoCount] = await db.select({ count: sql<number>`count(*)::int` }).from(videosTable);
  const [competitorCount] = await db.select({ count: sql<number>`count(distinct competitor)::int` }).from(videosTable);
  const [titleCount] = await db.select({ count: sql<number>`count(*)::int` }).from(titleAnalysesTable);
  const [scriptCount] = await db.select({ count: sql<number>`count(*)::int` }).from(scriptAnalysesTable);
  const [genCount] = await db.select({ count: sql<number>`count(*)::int` }).from(generatedScriptsTable);

  const recentScripts = await db.select({ id: generatedScriptsTable.id, title: generatedScriptsTable.title, createdAt: generatedScriptsTable.createdAt })
    .from(generatedScriptsTable).orderBy(desc(generatedScriptsTable.createdAt)).limit(3);

  const recentAnalyses = await db.select({ id: titleAnalysesTable.id, createdAt: titleAnalysesTable.createdAt })
    .from(titleAnalysesTable).orderBy(desc(titleAnalysesTable.createdAt)).limit(3);

  const activity = [
    ...recentScripts.map((s) => ({ type: "script_generated", label: `Script: "${s.title.substring(0, 50)}..."`, createdAt: s.createdAt.toISOString() })),
    ...recentAnalyses.map((a) => ({ type: "title_analyzed", label: `Title analysis #${a.id}`, createdAt: a.createdAt.toISOString() })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return res.json({
    totalVideos: videoCount.count,
    totalCompetitors: competitorCount.count,
    totalTitleAnalyses: titleCount.count,
    totalScriptAnalyses: scriptCount.count,
    totalGeneratedScripts: genCount.count,
    recentActivity: activity,
  });
});

export default router;
