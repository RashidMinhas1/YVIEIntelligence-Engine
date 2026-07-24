import { NextRequest, NextResponse } from "next/server";
import { getDb, videosTable } from "@/db";
import { eq } from "drizzle-orm";
import { FetchCompetitorVideosBody } from "@/lib/validators";
import { fetchCompetitorVideos } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const parsed = FetchCompetitorVideosBody.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { competitors, youtubeApiKey, limit } = parsed.data;
  const { videos: fetched, usedMockData } = await fetchCompetitorVideos(competitors, youtubeApiKey, limit);
  const db = getDb();

  try {
    await db.delete(videosTable).where(eq(videosTable.competitor, competitors[0]));

    const inserted = await db
      .insert(videosTable)
      .values(
        fetched.map((v) => ({
          competitor: v.competitor,
          title: v.title,
          views: v.views,
          url: v.url,
          publishedAt: v.publishedAt,
          thumbnailUrl: v.thumbnailUrl,
        }))
      )
      .returning();

    return NextResponse.json({ videos: inserted, usedMockData });
  } catch (error) {
    console.warn("[Local Dev] Database write failed. Returning fetched videos directly.", error);
    return NextResponse.json({ videos: fetched, usedMockData });
  }
}
