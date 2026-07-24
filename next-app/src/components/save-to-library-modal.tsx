"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, FolderPlus, Folder, AlertTriangle } from "lucide-react";
import { useJob } from "@/hooks/use-job";

import { KnowledgeCategory } from "@/lib/types/knowledge-object";

export interface LibraryItemPayload {
  type: "title" | "script" | "thumbnail" | "report" | KnowledgeCategory;
  title: string;
  content: any;
  rawTextToExtract?: string;
  originalScriptContext?: string;
  summary?: string;
  metadata?: any;
  tags?: string[];
}

interface SaveToLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payload: LibraryItemPayload | null;
  onSaved?: () => void;
}

export function SaveToLibraryModal({ open, onOpenChange, payload, onSaved }: SaveToLibraryModalProps) {
  const [folders, setFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>("root");
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [extractedPayload, setExtractedPayload] = useState<LibraryItemPayload | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  useEffect(() => {
    if (open && payload) {
      loadFolders(payload.type);
      setDuplicateWarning(false);
      setExtractedPayload(null);

      if (payload.rawTextToExtract) {
        performExtraction(payload);
      } else {
        setExtractedPayload(payload);
      }
    }
  }, [open, payload]);

  const { job: extractJob, isPolling: isExtracting, startPolling: startExtraction, reset: resetJob } = useJob(null, {
    onComplete: (result) => {
      if (payload) {
        setExtractedPayload({
          ...payload,
          title: result.title || payload.title,
          summary: result.summary || payload.summary,
          content: result.content,
          rawTextToExtract: undefined,
          originalScriptContext: undefined
        });
      }
    },
    onError: (err) => {
      toast.error(err || "Extraction failed");
      onOpenChange(false);
    }
  });

  const performExtraction = async (p: LibraryItemPayload) => {
    resetJob();
    try {
      const res = await fetch("/api/knowledge/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: p.rawTextToExtract,
          categoryId: p.type,
          originalScriptContext: p.originalScriptContext,
          title: p.title
        })
      });
      if (res.ok) {
        const data = await res.json();
        startExtraction(data.jobId);
      } else {
        toast.error("Failed to dispatch extraction");
        onOpenChange(false);
      }
    } catch (e) {
      toast.error("Extraction failed");
      onOpenChange(false);
    }
  };

  const loadFolders = async (section: string) => {
    try {
      // Maps singular types to their section equivalents if needed, or just fetches all
      // We pass section dynamically to the API
      const sectionMapping: Record<string, string> = {
        title: "titles",
        script: "scripts",
        hook: "hooks",
        cta: "ctas",
        thumbnail: "thumbnails",
        report: "reports",
      };
      const res = await fetch(`/api/library/folders?section=${sectionMapping[section] || section}`);
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !payload) return;
    setIsLoading(true);
    try {
      const sectionMapping: Record<string, string> = {
        title: "titles",
        script: "scripts",
        hook: "hooks",
        cta: "ctas",
        thumbnail: "thumbnails",
        report: "reports",
      };
      
      const res = await fetch("/api/library/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName.trim(),
          section: sectionMapping[payload.type] || payload.type,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFolders([data.folder, ...folders]);
        setSelectedFolderId(data.folder.id);
        setIsCreatingFolder(false);
        setNewFolderName("");
      } else {
        toast.error("Failed to create folder");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (force: boolean | string = false) => {
    if (!extractedPayload) return;
    setIsLoading(true);
    try {
      const folderId = selectedFolderId === "root" ? null : selectedFolderId;
      const res = await fetch(`/api/library/items${force ? '?force=true' : ''}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...extractedPayload,
          folderId,
          updateAction: force === "update" ? true : undefined
        }),
      });

      if (res.status === 409 && !force) {
        setDuplicateWarning(true);
        setIsLoading(false);
        return;
      }

      if (res.ok) {
        toast.success("Saved to Library!");
        onOpenChange(false);
        onSaved?.();
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to save");
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!payload) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save to Library</DialogTitle>
          <DialogDescription>
            Organize this {payload.type} format into a custom folder for future reuse.
          </DialogDescription>
        </DialogHeader>

        {isExtracting ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{extractJob?.currentStep || "Extracting Knowledge Object..."}</p>
          </div>
        ) : !duplicateWarning && extractedPayload ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input value={extractedPayload.title} disabled className="bg-muted" />
            </div>

            <div className="space-y-2">
              <Label>Select Folder</Label>
              {!isCreatingFolder ? (
                <div className="flex items-center gap-2">
                  <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Root Directory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="root">
                        <div className="flex items-center gap-2"><Folder className="w-4 h-4 text-muted-foreground"/> Root Directory</div>
                      </SelectItem>
                      {folders.map(f => (
                        <SelectItem key={f.id} value={f.id}>
                          <div className="flex items-center gap-2"><Folder className="w-4 h-4 text-muted-foreground"/> {f.name}</div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => setIsCreatingFolder(true)} title="New Folder">
                    <FolderPlus className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input 
                    placeholder="Folder Name" 
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    autoFocus
                  />
                  <Button onClick={handleCreateFolder} disabled={isLoading || !newFolderName.trim()}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                  </Button>
                  <Button variant="ghost" onClick={() => setIsCreatingFolder(false)}>Cancel</Button>
                </div>
              )}
            </div>
          </div>
        ) : (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  <strong>Duplicate Detected</strong>
                </div>
                An item very similar to this already exists in your library. What would you like to do?
              </div>
              <div className="flex flex-col gap-2">
                <Button onClick={() => handleSave("update")} disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Existing Item"}
                </Button>
                <Button onClick={() => handleSave(true)} disabled={isLoading} variant="secondary" className="w-full">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save as New Item"}
                </Button>
              </div>
            </div>
        )}

        {!duplicateWarning && !isExtracting && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => handleSave(false)} disabled={isLoading || isCreatingFolder}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save to Library
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
