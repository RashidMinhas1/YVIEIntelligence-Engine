import { getDb, libraryItemsTable } from "@/db";
import { localDb } from "@/lib/local-db";
import { AssemblyWorkspace } from "@/components/assembly/assembly-workspace";

export const dynamic = "force-dynamic";

import { AppLayout } from "@/components/app-layout";

export default async function BuilderPage() {
  let libraryItems: any[] = [];
  try {
    const db = getDb();
    libraryItems = await db.select().from(libraryItemsTable);
  } catch (err) {
    console.warn("[Local Dev] BuilderPage DB connection failed. Using local DB.");
    libraryItems = localDb.getAll("libraryItems");
  }

  // We only need to fetch Assembly Templates if the user wants to load one
  const assemblyTemplates = libraryItems
    .filter(item => item.type === "assembly")
    .map(item => ({
      id: item.id,
      title: item.title,
      content: item.content as any,
      metadata: item.metadata,
      createdAt: item.createdAt,
    }));

  return (
    <AppLayout>
      <div className="flex-1 overflow-hidden flex flex-col h-full bg-background">
        <AssemblyWorkspace 
          assemblyTemplates={assemblyTemplates}
        />
      </div>
    </AppLayout>
  );
}
