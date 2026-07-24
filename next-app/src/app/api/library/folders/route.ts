import { NextResponse } from "next/server";
import { getDb, libraryFoldersTable } from "@/db";
import { eq, desc } from "drizzle-orm";
import { SaveLibraryFolderBody } from "@/lib/validators";
import { localDb } from "@/lib/local-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section");
    
    const db = getDb();
    let query = db.select().from(libraryFoldersTable).orderBy(desc(libraryFoldersTable.createdAt));
    
    const rows = await query;
    let filteredRows = rows;
    if (section) {
      filteredRows = rows.filter(r => r.section === section);
    }
    return NextResponse.json({ folders: filteredRows });
  } catch (err: any) {
    console.error("[Local Dev] DB connection failed. Returning local JSON folders.");
    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section");
    let folders = localDb.getDb().libraryFolders || [];
    if (section) {
      folders = folders.filter((f: any) => f.section === section);
    }
    return NextResponse.json({ folders });
  }
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const body = SaveLibraryFolderBody.parse(json);

    try {
      const db = getDb();
      const id = "f" + Date.now();
      const [newFolder] = await db.insert(libraryFoldersTable).values({
        id,
        name: body.name,
        section: body.section,
      }).returning();
      return NextResponse.json({ folder: newFolder });
    } catch (dbErr: any) {
      console.warn("[Local Dev] DB write failed. Using local JSON store.");
      const newFolder = {
        id: "f" + Date.now(),
        name: body.name,
        section: body.section,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const ldb = localDb.getDb();
      ldb.libraryFolders = ldb.libraryFolders || [];
      ldb.libraryFolders.unshift(newFolder);
      localDb.saveDb(ldb);
      return NextResponse.json({ folder: newFolder });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const moveToFolderId = searchParams.get("moveToFolderId"); // Optional, if provided items move here
    if (!id) return NextResponse.json({ error: "Missing folder ID" }, { status: 400 });

    try {
      const db = getDb();
      
      // TODO: Logic to move items to moveToFolderId or delete them
      // Since this is generic, we'll implement that carefully later in item endpoints
      // For now, just delete the folder
      
      await db.delete(libraryFoldersTable).where(eq(libraryFoldersTable.id, id));
      return NextResponse.json({ success: true });
    } catch (dbErr: any) {
      console.warn("[Local Dev] DB write failed. Using local JSON store.");
      const ldb = localDb.getDb();
      ldb.libraryFolders = (ldb.libraryFolders || []).filter((f: any) => f.id !== id);
      
      if (moveToFolderId) {
         ldb.libraryItems = (ldb.libraryItems || []).map((i: any) => 
            i.folderId === id ? { ...i, folderId: moveToFolderId } : i
         );
      } else {
         // permanent delete
         ldb.libraryItems = (ldb.libraryItems || []).filter((i: any) => i.folderId !== id);
      }
      
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
    const name = json.name;
    if (!id || !name) return NextResponse.json({ error: "Missing ID or name" }, { status: 400 });
    
    try {
      const db = getDb();
      const [updatedFolder] = await db.update(libraryFoldersTable)
        .set({
           name,
           updatedAt: new Date(),
        })
        .where(eq(libraryFoldersTable.id, id))
        .returning();
      return NextResponse.json({ folder: updatedFolder });
    } catch (dbErr: any) {
      const ldb = localDb.getDb();
      let updatedFolder = null;
      ldb.libraryFolders = (ldb.libraryFolders || []).map((f: any) => {
        if (f.id === id) {
           updatedFolder = { ...f, name, updatedAt: new Date().toISOString() };
           return updatedFolder;
        }
        return f;
      });
      localDb.saveDb(ldb);
      return NextResponse.json({ folder: updatedFolder });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
