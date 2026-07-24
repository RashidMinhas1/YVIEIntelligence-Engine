import { NextResponse } from "next/server";
import { getDb, libraryItemsTable } from "@/db";
import { desc, eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");

  if (!parentId) {
    return NextResponse.json({ error: "Missing parentId" }, { status: 400 });
  }

  try {
    let useLocalDb = false;
    let db;
    try {
      db = getDb();
      await db.select({ id: libraryItemsTable.id }).from(libraryItemsTable).limit(1);
    } catch (e) {
      useLocalDb = true;
    }

    if (!useLocalDb && db) {
      const versions = await db
        .select()
        .from(libraryItemsTable)
        .where(
          and(
            eq(libraryItemsTable.type, "studio_project_version"),
            eq(libraryItemsTable.parentId, parentId)
          )
        )
        .orderBy(desc(libraryItemsTable.version));

      return NextResponse.json({ versions });
    } else {
      const { localDb } = await import("@/lib/local-db");
      const items = localDb.getAll("libraryItems");
      const versions = items.filter(i => i.type === "studio_project_version" && i.parentId === parentId);
      versions.sort((a, b) => (b.version || 0) - (a.version || 0));
      return NextResponse.json({ versions });
    }
  } catch (error: any) {
    console.error("[Studio Versions API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
