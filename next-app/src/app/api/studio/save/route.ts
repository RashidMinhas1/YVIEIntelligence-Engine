import { NextResponse } from "next/server";
import { getDb, libraryItemsTable } from "@/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const saveSchema = z.object({
  project: z.any()
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { project } = saveSchema.parse(json);
    
    let useLocalDb = false;
    let db;
    try {
      db = getDb();
      // Test connection
      await db.select({ id: libraryItemsTable.id }).from(libraryItemsTable).limit(1);
    } catch (e) {
      useLocalDb = true;
    }

    if (!useLocalDb && db) {
      // Check if exists
      const existing = await db
        .select({ id: libraryItemsTable.id, version: libraryItemsTable.version })
        .from(libraryItemsTable)
        .where(eq(libraryItemsTable.id, project.id))
        .limit(1);

      let newVersion = 1;
      if (existing.length > 0) {
        newVersion = existing[0].version ? existing[0].version + 1 : 1;
        await db.update(libraryItemsTable).set({
          title: project.title,
          content: project,
          updatedAt: new Date(),
          version: newVersion
        }).where(eq(libraryItemsTable.id, project.id));
      } else {
        await db.insert(libraryItemsTable).values({
          id: project.id,
          type: "studio_project",
          title: project.title,
          content: project,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: newVersion
        });
      }

      // Save version snapshot
      await db.insert(libraryItemsTable).values({
        id: crypto.randomUUID(),
        type: "studio_project_version",
        parentId: project.id,
        title: `${project.title} - Version ${newVersion}`,
        content: project,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: newVersion
      });
    } else {
      import("@/lib/local-db").then(({ localDb }) => {
        const items = localDb.getAll("libraryItems");
        const existingIndex = items.findIndex(i => i.id === project.id && i.type === "studio_project");
        let newVersion = 1;
        if (existingIndex >= 0) {
          newVersion = (items[existingIndex].version || 1) + 1;
          items[existingIndex] = { ...items[existingIndex], title: project.title, content: project, updatedAt: new Date().toISOString(), version: newVersion };
        } else {
          items.push({ id: project.id, type: "studio_project", title: project.title, content: project, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: newVersion });
        }
        // Save version snapshot
        items.push({
          id: crypto.randomUUID(),
          type: "studio_project_version",
          parentId: project.id,
          title: `${project.title} - Version ${newVersion}`,
          content: project,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: newVersion
        });
        const dbState = localDb.getDb();
        dbState.libraryItems = items;
        localDb.saveDb(dbState);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Studio Save API] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
