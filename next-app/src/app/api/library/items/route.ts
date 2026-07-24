import { NextResponse } from "next/server";
import { getDb, libraryItemsTable } from "@/db";
import { eq, desc } from "drizzle-orm";
import { SaveLibraryItemBody } from "@/lib/validators";
import { localDb } from "@/lib/local-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const folderId = searchParams.get("folderId");
    
    const db = getDb();
    const rows = await db.select().from(libraryItemsTable).orderBy(desc(libraryItemsTable.createdAt));
    
    let filteredRows = rows;
    if (type) filteredRows = filteredRows.filter(r => r.type === type);
    if (folderId) filteredRows = filteredRows.filter(r => r.folderId === folderId);
    
    return NextResponse.json({ items: filteredRows });
  } catch (err: any) {
    console.error("[Local Dev] DB connection failed. Returning local JSON items.");
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const folderId = searchParams.get("folderId");
    
    let items = localDb.getDb().libraryItems || [];
    if (type) items = items.filter((i: any) => i.type === type);
    if (folderId) items = items.filter((i: any) => i.folderId === folderId);
    
    return NextResponse.json({ items });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = SaveLibraryItemBody.parse(json);
    const { searchParams } = new URL(req.url);
    const forceSave = searchParams.get("force") === "true"; // Bypass duplicate check

    try {
      const db = getDb();
      
      // Duplicate detection
      let existingDupId: string | null = null;
      if (!forceSave && !body.updateAction) {
         const existing = await db.select().from(libraryItemsTable).where(eq(libraryItemsTable.type, body.type));
         const isDup = existing.find(e => 
           (e.title.toLowerCase() === body.title.toLowerCase()) || 
           (e.metadata && typeof e.metadata === "object" && body.metadata && typeof body.metadata === "object" && (e.metadata as any).videoId && (e.metadata as any).videoId === (body.metadata as any).videoId)
         );
         
         if (isDup && isDup.folderId === body.folderId) {
            return NextResponse.json({ duplicate: true, message: "An item with this name or video reference already exists in this folder." }, { status: 409 });
         }
      }

      if (body.updateAction) {
         // Find the exact item to update
         const existing = await db.select().from(libraryItemsTable).where(eq(libraryItemsTable.type, body.type));
         const dup = existing.find(e => 
            e.title.toLowerCase() === body.title.toLowerCase() && e.folderId === body.folderId
         );
         if (dup) {
            const [updatedItem] = await db.update(libraryItemsTable)
              .set({
                content: body.content,
                summary: body.summary,
                metadata: body.metadata || {},
                tags: body.tags || [],
                updatedAt: new Date(),
              })
              .where(eq(libraryItemsTable.id, dup.id))
              .returning();
            return NextResponse.json({ item: updatedItem });
         }
      }

      const id = "i" + Date.now();
      const [newItem] = await db.insert(libraryItemsTable).values({
        id,
        folderId: body.folderId || null,
        type: body.type,
        title: body.title,
        content: body.content,
        summary: body.summary,
        metadata: body.metadata || {},
        tags: body.tags || [],
      }).returning();
      return NextResponse.json({ item: newItem });
    } catch (dbErr: any) {
      console.warn("[Local Dev] DB write failed. Using local JSON store.");
      const ldb = localDb.getDb();
      ldb.libraryItems = ldb.libraryItems || [];
      
      if (!forceSave && !body.updateAction) {
         const isDup = ldb.libraryItems.find((e: any) => 
           e.type === body.type && 
           e.folderId === body.folderId && 
           (e.title.toLowerCase() === body.title.toLowerCase() || (e.metadata?.videoId && e.metadata?.videoId === (body.metadata as any)?.videoId))
         );
         if (isDup) {
            return NextResponse.json({ duplicate: true, message: "An item with this name or video reference already exists in this folder." }, { status: 409 });
         }
      }

      if (body.updateAction) {
         const dupIndex = ldb.libraryItems.findIndex((e: any) => e.type === body.type && e.title.toLowerCase() === body.title.toLowerCase() && e.folderId === body.folderId);
         if (dupIndex !== -1) {
            ldb.libraryItems[dupIndex] = {
               ...ldb.libraryItems[dupIndex],
               content: body.content,
               summary: body.summary,
               metadata: body.metadata || {},
               tags: body.tags || [],
               updatedAt: new Date().toISOString(),
            };
            localDb.saveDb(ldb);
            return NextResponse.json({ item: ldb.libraryItems[dupIndex] });
         }
      }

      const newItem = {
        id: "i" + Date.now(),
        folderId: body.folderId || null,
        type: body.type,
        title: body.title,
        content: body.content,
        summary: body.summary,
        metadata: body.metadata || {},
        tags: body.tags || [],
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      ldb.libraryItems.unshift(newItem);
      localDb.saveDb(ldb);
      return NextResponse.json({ item: newItem });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    try {
      const db = getDb();
      await db.delete(libraryItemsTable).where(eq(libraryItemsTable.id, id));
      return NextResponse.json({ success: true });
    } catch (dbErr: any) {
      const ldb = localDb.getDb();
      ldb.libraryItems = (ldb.libraryItems || []).filter((i: any) => i.id !== id);
      localDb.saveDb(ldb);
      return NextResponse.json({ success: true });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const json = await req.json();
    const id = json.id;
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    
    // We can update folderId, title, content, summary, tags, metadata
    try {
      const db = getDb();
      const [updatedItem] = await db.update(libraryItemsTable)
        .set({
           folderId: json.folderId !== undefined ? json.folderId : undefined,
           title: json.title,
           content: json.content,
           summary: json.summary,
           tags: json.tags,
           metadata: json.metadata,
           updatedAt: new Date(),
        })
        .where(eq(libraryItemsTable.id, id))
        .returning();
      return NextResponse.json({ item: updatedItem });
    } catch (dbErr: any) {
      const ldb = localDb.getDb();
      let updatedItem = null;
      ldb.libraryItems = (ldb.libraryItems || []).map((i: any) => {
        if (i.id === id) {
           updatedItem = {
              ...i,
              folderId: json.folderId !== undefined ? json.folderId : i.folderId,
              title: json.title ?? i.title,
              content: json.content ?? i.content,
              summary: json.summary !== undefined ? json.summary : i.summary,
              tags: json.tags ?? i.tags,
              metadata: json.metadata ?? i.metadata,
              updatedAt: new Date().toISOString(),
           };
           return updatedItem;
        }
        return i;
      });
      localDb.saveDb(ldb);
      return NextResponse.json({ item: updatedItem });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
