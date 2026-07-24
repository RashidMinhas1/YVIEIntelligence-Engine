"use client";

import { useState } from "react";
import { FolderSidebar } from "./folder-sidebar";
import { LibraryItemsGrid } from "./library-items-grid";
import { LibraryItemEditorModal } from "./library-item-editor-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, FileText, Magnet, MousePointerClick, Image as ImageIcon, BarChart } from "lucide-react";

export function MyLibraryView() {
  const [activeTab, setActiveTab] = useState("titles");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any | null>(null);

  // When switching tabs, reset folder selection
  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSelectedFolderId(null);
  };

  return (
    <div className="border border-border rounded-xl bg-background overflow-hidden flex flex-col min-h-[600px]">
      <div className="border-b border-border p-2 bg-muted/5">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-transparent space-x-1 overflow-x-auto flex flex-wrap h-auto p-0 hide-scrollbar justify-start">
            <TabsTrigger value="titles" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-mono py-1.5 px-3">
              <BookOpen className="w-3 h-3 mr-2" /> Title Formats
            </TabsTrigger>
            <TabsTrigger value="scripts" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-mono py-1.5 px-3">
              <FileText className="w-3 h-3 mr-2" /> Script Formats
            </TabsTrigger>
            
            {/* Future Modules Enabled */}
            <TabsTrigger value="hooks" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-mono py-1.5 px-3">
              <Magnet className="w-3 h-3 mr-2" /> Hooks
            </TabsTrigger>
            <TabsTrigger value="ctas" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-mono py-1.5 px-3">
              <MousePointerClick className="w-3 h-3 mr-2" /> CTAs
            </TabsTrigger>
            <TabsTrigger value="thumbnails" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-mono py-1.5 px-3">
              <ImageIcon className="w-3 h-3 mr-2" /> Thumbnails
            </TabsTrigger>
            <TabsTrigger value="reports" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-md text-xs font-mono py-1.5 px-3">
              <BarChart className="w-3 h-3 mr-2" /> Reports
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <FolderSidebar 
          section={activeTab} 
          selectedFolderId={selectedFolderId} 
          onSelectFolder={setSelectedFolderId} 
        />
        
        <LibraryItemsGrid 
          section={activeTab} 
          selectedFolderId={selectedFolderId} 
          onOpenItem={setEditingItem}
        />
      </div>

      <LibraryItemEditorModal 
        item={editingItem} 
        open={!!editingItem} 
        onOpenChange={(open) => !open && setEditingItem(null)} 
        section={activeTab}
      />
    </div>
  );
}
