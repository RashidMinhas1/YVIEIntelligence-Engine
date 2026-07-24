import { NextResponse } from "next/server";
import { getDb, libraryItemsTable } from "@/db";
import { desc, eq } from "drizzle-orm";

export async function GET(req: Request) {
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
      const existing = await db
        .select()
        .from(libraryItemsTable)
        .where(eq(libraryItemsTable.type, "studio_project"))
        .orderBy(desc(libraryItemsTable.updatedAt))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json({ project: existing[0].content });
      }
    } else {
      const { localDb } = await import("@/lib/local-db");
      const items = localDb.getAll("libraryItems");
      const projects = items.filter(i => i.type === "studio_project");
      if (projects.length > 0) {
        projects.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
        return NextResponse.json({ project: projects[0].content });
      }
    }

    return NextResponse.json({ project: null });
  } catch (error: any) {
    console.error("[Studio Load API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
