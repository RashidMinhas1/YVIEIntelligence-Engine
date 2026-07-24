"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Folder, FolderPlus, MoreVertical, Trash2, Edit2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FolderSidebarProps {
  section: string;
  selectedFolderId: string | null;
  onSelectFolder: (id: string | null) => void;
}

export function FolderSidebar({ section, selectedFolderId, onSelectFolder }: FolderSidebarProps) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [deleteFolderId, setDeleteFolderId] = useState<string | null>(null);
  const [moveToFolderId, setMoveToFolderId] = useState<string>("permanent");
  
  const { data: foldersData, isLoading } = useQuery({
    queryKey: ["library-folders", section],
    queryFn: async () => {
      const res = await fetch(`/api/library/folders?section=${section}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const folders = foldersData?.folders || [];

  const createFolder = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/library/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, section }),
      });
      if (!res.ok) throw new Error("Failed to create folder");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-folders", section] });
      setIsCreating(false);
      setNewFolderName("");
      toast.success("Folder created");
    },
  });

  const deleteFolder = useMutation({
    mutationFn: async ({ id, moveTo }: { id: string; moveTo: string | null }) => {
      let url = `/api/library/folders?id=${id}`;
      if (moveTo && moveTo !== "permanent") url += `&moveToFolderId=${moveTo}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete folder");
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["library-folders", section] });
      queryClient.invalidateQueries({ queryKey: ["library-items"] });
      if (selectedFolderId === variables.id) onSelectFolder(null);
      setDeleteFolderId(null);
      toast.success("Folder deleted");
    },
  });

  return (
    <div className="w-64 border-r border-border min-h-[500px] flex flex-col bg-muted/10">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-foreground">Folders</h3>
        <Button variant="ghost" size="icon" onClick={() => setIsCreating(true)} className="h-7 w-7">
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-2 flex-1 overflow-y-auto space-y-1">
        {isCreating && (
          <div className="flex items-center gap-2 p-2">
            <Input 
              autoFocus
              className="h-8 text-xs font-mono"
              placeholder="Folder name..."
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') createFolder.mutate(newFolderName);
                if (e.key === 'Escape') setIsCreating(false);
              }}
            />
          </div>
        )}

        <button
          onClick={() => onSelectFolder(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-mono rounded-md transition-colors ${
            selectedFolderId === null ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted/50"
          }`}
        >
          <Folder className="w-4 h-4" />
          All Items
        </button>

        {folders.map((f: any) => (
          <div key={f.id} className="group flex items-center justify-between px-1">
            <button
              onClick={() => onSelectFolder(f.id)}
              className={`flex-1 flex items-center gap-2 px-2 py-2 text-sm font-mono rounded-md transition-colors truncate ${
                selectedFolderId === f.id ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <Folder className="w-4 h-4 shrink-0" />
              <span className="truncate">{f.name}</span>
            </button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-xs" onClick={() => {
                  // Rename logic here (skipping for brevity, can add later)
                  toast.info("Rename feature coming soon");
                }}>
                  <Edit2 className="w-3 h-3 mr-2" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs text-destructive focus:text-destructive" onClick={() => setDeleteFolderId(f.id)}>
                  <Trash2 className="w-3 h-3 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      <Dialog open={!!deleteFolderId} onOpenChange={(open) => !open && setDeleteFolderId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Folder</DialogTitle>
            <DialogDescription>
              What would you like to do with the items inside this folder?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select value={moveToFolderId} onValueChange={setMoveToFolderId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="permanent" className="text-destructive font-bold">Permanently Delete Contents</SelectItem>
                <SelectItem value="root">Move to Root (All Items)</SelectItem>
                {folders.filter((f:any) => f.id !== deleteFolderId).map((f:any) => (
                  <SelectItem key={f.id} value={f.id}>Move to: {f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteFolderId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => {
              if (deleteFolderId) deleteFolder.mutate({ id: deleteFolderId, moveTo: moveToFolderId === "permanent" ? null : (moveToFolderId === "root" ? "root" : moveToFolderId) });
            }}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
