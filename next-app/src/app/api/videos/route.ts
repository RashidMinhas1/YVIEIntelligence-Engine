import { NextRequest, NextResponse } from "next/server";
import { getDb, videosTable } from "@/db";
import { eq } from "drizzle-orm";
import { GetVideosQueryParams } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const parsed = GetVideosQueryParams.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  const db = getDb();

  const rows =
    parsed.success && parsed.data.competitor
      ? await db.select().from(videosTable).where(eq(videosTable.competitor, parsed.data.competitor))
      : await db.select().from(videosTable);

  return NextResponse.json({ videos: rows });
}
