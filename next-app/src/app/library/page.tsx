"use client";

import { useEffect, useState } from "react";
import { KnowledgeSidebar } from "./components/knowledge-sidebar";
import { LibraryItemsGrid } from "./components/library-items-grid";
import { LibraryItemEditorModal } from "./components/library-item-editor-modal";
import { AppLayout } from "@/components/app-layout";
import { KNOWLEDGE_CATEGORIES } from "@/lib/config/knowledge-categories";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function LibraryPage() {
  // Default to the first category
  const [selectedCategory, setSelectedCategory] = useState<string>(KNOWLEDGE_CATEGORIES[0].id);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);

  const handleSelect = (categoryId: string, folderId: string | null) => {
    setSelectedCategory(categoryId);
    setSelectedFolderId(folderId);
  };

  const activeCategoryConfig = KNOWLEDGE_CATEGORIES.find(c => c.id === selectedCategory);

  return (
    <AppLayout>
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Knowledge Base</h2>
            <p className="text-muted-foreground text-sm mt-1 font-mono">Manage your reusable frameworks, structures, and components</p>
          </div>
          <Button 
            onClick={() => setEditingItem({ type: selectedCategory, isNew: true })}
            className="font-mono text-xs font-bold"
          >
            <Plus className="w-4 h-4 mr-2" /> Create New {activeCategoryConfig?.label}
          </Button>
        </div>

        {/* Workspace */}
        <div className="flex flex-1 overflow-hidden">
          <KnowledgeSidebar 
            selectedCategory={selectedCategory}
            selectedFolderId={selectedFolderId}
            onSelect={handleSelect}
          />
          
          <LibraryItemsGrid 
            section={selectedCategory} 
            selectedFolderId={selectedFolderId} 
            onOpenItem={setEditingItem}
          />
        </div>

        <LibraryItemEditorModal 
          item={editingItem} 
          open={!!editingItem} 
          onOpenChange={(open) => !open && setEditingItem(null)} 
          section={selectedCategory}
        />
      </div>
    </AppLayout>
  );
}
