"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, FolderPlus, MoreVertical, Trash2, Edit2, ChevronDown, ChevronRight, Library } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { KNOWLEDGE_CATEGORIES, KnowledgeCategoryConfig } from "@/lib/config/knowledge-categories";

interface KnowledgeSidebarProps {
  selectedCategory: string;
  selectedFolderId: string | null;
  onSelect: (categoryId: string, folderId: string | null) => void;
}

export function KnowledgeSidebar({ selectedCategory, selectedFolderId, onSelect }: KnowledgeSidebarProps) {
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({ [selectedCategory]: true });
  
  const [isCreatingFolderFor, setIsCreatingFolderFor] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({ ...prev, [categoryId]: !prev[categoryId] }));
  };

  const { data: foldersData } = useQuery({
    queryKey: ["library-folders-all"],
    queryFn: async () => {
      // Fetch all folders for all sections/categories
      const res = await fetch(`/api/library/folders`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const folders = foldersData?.folders || [];

  const createFolder = useMutation({
    mutationFn: async ({ name, section }: { name: string; section: string }) => {
      const res = await fetch("/api/library/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, section }),
      });
      if (!res.ok) throw new Error("Failed to create folder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-folders-all"] });
      setIsCreatingFolderFor(null);
      setNewFolderName("");
      toast.success("Folder created");
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/library/folders?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete folder");
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["library-folders-all"] });
      queryClient.invalidateQueries({ queryKey: ["library-items"] });
      if (selectedFolderId === id) onSelect(selectedCategory, null);
      toast.success("Folder deleted");
    },
  });

  return (
    <div className="w-64 border-r border-border h-full flex flex-col bg-muted/10 overflow-hidden shrink-0">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-foreground">
          <Library className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold font-mono tracking-wider">KNOWLEDGE BASE</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
        {KNOWLEDGE_CATEGORIES.map((category) => {
          const isExpanded = expandedCategories[category.id];
          const isSelected = selectedCategory === category.id && selectedFolderId === null;
          const categoryFolders = folders.filter((f: any) => f.section === category.id);
          const Icon = category.icon;

          return (
            <div key={category.id} className="space-y-1">
              <div 
                className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors group ${
                  isSelected ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"
                }`}
              >
                <div 
                  className="flex items-center gap-2 flex-1" 
                  onClick={() => {
                    toggleCategory(category.id);
                    onSelect(category.id, null);
                  }}
                >
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5 opacity-50" /> : <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                  <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-sm font-mono">{category.label}</span>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="w-5 h-5 opacity-0 group-hover:opacity-100 h-auto p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsCreatingFolderFor(category.id);
                    setExpandedCategories(prev => ({ ...prev, [category.id]: true }));
                  }}
                >
                  <FolderPlus className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                </Button>
              </div>

              {isExpanded && (
                <div className="pl-6 space-y-1">
                  {categoryFolders.map((folder: any) => {
                    const isFolderSelected = selectedCategory === category.id && selectedFolderId === folder.id;
                    return (
                      <div 
                        key={folder.id}
                        className={`flex items-center justify-between px-2 py-1 rounded-md text-xs font-mono cursor-pointer group ${
                          isFolderSelected ? "bg-primary/5 text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                        }`}
                        onClick={() => onSelect(category.id, folder.id)}
                      >
                        <div className="flex items-center gap-2 flex-1 truncate">
                          <Folder className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{folder.name}</span>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-4 h-4 opacity-0 group-hover:opacity-100 p-0 ml-1 shrink-0">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-32">
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive text-xs cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Delete folder and move all items to root?")) {
                                  deleteFolder.mutate(folder.id);
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })}
                  
                  {isCreatingFolderFor === category.id && (
                    <div className="px-2 py-1">
                      <Input 
                        autoFocus
                        className="h-6 text-xs font-mono bg-background"
                        placeholder="Folder name..."
                        value={newFolderName}
                        onChange={e => setNewFolderName(e.target.value)}
                        onBlur={() => setIsCreatingFolderFor(null)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newFolderName.trim()) {
                            createFolder.mutate({ name: newFolderName, section: category.id });
                          }
                          if (e.key === 'Escape') setIsCreatingFolderFor(null);
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
