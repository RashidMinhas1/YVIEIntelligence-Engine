"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Copy, Trash2, Tag, Save, Clock, FolderInput, Star, Link as LinkIcon, History } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { KNOWLEDGE_CATEGORIES, FieldConfig } from "@/lib/config/knowledge-categories";

interface LibraryItemEditorModalProps {
  item: any | null; // If item.isNew is true, we are creating
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: string; // The category id
}

export function LibraryItemEditorModal({ item, open, onOpenChange, section }: LibraryItemEditorModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  const [newTag, setNewTag] = useState("");

  const categoryConfig = KNOWLEDGE_CATEGORIES.find(c => c.id === section) || KNOWLEDGE_CATEGORIES[0];

  const { data: foldersData } = useQuery({
    queryKey: ["library-folders-all"],
    queryFn: async () => {
      const res = await fetch(`/api/library/folders`);
      return res.json();
    },
    enabled: open,
  });
  
  const folders = foldersData?.folders?.filter((f:any) => f.section === section) || [];

  useEffect(() => {
    if (item && open) {
      if (item.isNew) {
        setFormData({
          title: "",
          summary: "",
          type: section,
          folderId: "root",
          content: {},
          metadata: { provider: "Manual", tags: [] },
          tags: []
        });
        setIsEditing(true);
      } else {
        setFormData(JSON.parse(JSON.stringify(item))); // Deep copy
        setIsEditing(false);
      }
    }
  }, [item, open, section]);

  const saveMutation = useMutation({
    mutationFn: async (updated: any) => {
      const isCreate = !updated.id;
      const res = await fetch("/api/library/items", {
        method: isCreate ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-items"] });
      toast.success(item?.isNew ? "Item created" : "Item updated");
      setIsEditing(false);
      if (item?.isNew) onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: async (itemToDuplicate: any) => {
      const { id, ...rest } = itemToDuplicate;
      const res = await fetch("/api/library/items?force=true", { // Bypass dup check
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, title: `${rest.title} (Copy)` }),
      });
      if (!res.ok) throw new Error("Failed to duplicate");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-items"] });
      toast.success("Item duplicated");
      onOpenChange(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/library/items?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library-items"] });
      toast.success("Item deleted");
      onOpenChange(false);
    },
  });

  if (!item) return null;

  const handleContentChange = (key: string, val: string) => {
    setFormData((s: any) => ({
      ...s,
      content: { ...(s.content || {}), [key]: val }
    }));
  };

  const handleMetadataChange = (key: string, val: any) => {
    setFormData((s: any) => ({
      ...s,
      metadata: { ...(s.metadata || {}), [key]: val }
    }));
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      const currentTags = formData.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        setFormData({ ...formData, tags: [...currentTags, newTag.trim()] });
      }
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (!isEditing) return;
    setFormData({ ...formData, tags: formData.tags.filter((t: string) => t !== tagToRemove) });
  };

  const renderDynamicField = (field: FieldConfig) => {
    const value = formData.content?.[field.id] || "";
    
    return (
      <div key={field.id} className="space-y-2">
        <Label className="text-xs font-mono text-muted-foreground">
          {field.label} {field.required && "*"}
        </Label>
        {field.type === "textarea" || field.type === "markdown" ? (
          <Textarea 
            value={value} 
            onChange={(e) => handleContentChange(field.id, e.target.value)} 
            readOnly={!isEditing} 
            placeholder={field.placeholder}
            className={`font-mono min-h-[100px] ${!isEditing ? "bg-muted/30 border-transparent" : ""}`} 
          />
        ) : field.type === "select" ? (
          <Select 
            value={value} 
            onValueChange={(val) => handleContentChange(field.id, val)}
            disabled={!isEditing}
          >
            <SelectTrigger className={`font-mono ${!isEditing ? "bg-muted/30 border-transparent" : ""}`}>
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
            </SelectContent>
          </Select>
        ) : (
          <Input 
            type={field.type === "number" ? "number" : "text"}
            value={value} 
            onChange={(e) => handleContentChange(field.id, e.target.value)} 
            readOnly={!isEditing} 
            placeholder={field.placeholder}
            className={`font-mono ${!isEditing ? "bg-muted/30 border-transparent" : ""}`} 
          />
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-background">
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="uppercase font-mono text-[10px] tracking-wider bg-primary/10 text-primary border-primary/20">
              {categoryConfig.label}
            </Badge>
            <DialogTitle className="font-mono text-lg">{isEditing ? (item.isNew ? "Create New" : "Editing Item") : formData.title || "Untitled"}</DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="h-8 font-mono text-xs">
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => duplicateMutation.mutate(formData)} className="h-8 font-mono text-xs" disabled={duplicateMutation.isPending}>
                  <Copy className="w-3 h-3 mr-2" /> Duplicate
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(formData.id)} className="h-8 font-mono text-xs text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-3 h-3 mr-2" /> Delete
                </Button>
              </>
            ) : (
              <>
                {!item.isNew && (
                  <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setFormData(JSON.parse(JSON.stringify(item))); }} className="h-8 font-mono text-xs">
                    Cancel
                  </Button>
                )}
                <Button size="sm" onClick={() => saveMutation.mutate(formData)} className="h-8 font-mono text-xs bg-primary hover:bg-primary/90 text-primary-foreground" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                  Save
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8 custom-scrollbar">
          {/* Main Content Editor */}
          <div className="flex-1 space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Title</Label>
              <Input 
                value={formData.title || ""} 
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                readOnly={!isEditing}
                placeholder="Give it a descriptive name..."
                className={`font-mono text-lg font-bold ${!isEditing ? "bg-muted/30 border-transparent focus-visible:ring-0" : ""}`}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea 
                value={formData.summary || ""} 
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                readOnly={!isEditing}
                placeholder="Brief summary of what this is..."
                className={`font-mono min-h-[60px] resize-y ${!isEditing ? "bg-muted/30 border-transparent focus-visible:ring-0" : ""}`}
              />
            </div>

            <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/5">
              <h4 className="text-sm font-bold font-mono border-b border-border pb-2 mb-4 uppercase text-foreground flex items-center gap-2">
                <categoryConfig.icon className="w-4 h-4 text-primary" /> 
                {categoryConfig.label} Content
              </h4>
              
              {/* Render dynamic fields based on configuration */}
              <div className="grid gap-6">
                {categoryConfig.fields.map(renderDynamicField)}
              </div>
            </div>

            {/* Universal Notes */}
            <div className="space-y-4 p-4 rounded-xl border border-border bg-muted/5">
              <h4 className="text-sm font-bold font-mono border-b border-border pb-2 mb-4 uppercase text-foreground">Universal Notes</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-muted-foreground">Personal Notes</Label>
                  <Textarea 
                    value={formData.metadata?.personalNotes || ""} 
                    onChange={(e) => handleMetadataChange("personalNotes", e.target.value)} 
                    readOnly={!isEditing} 
                    className={`font-mono min-h-[80px] ${!isEditing ? "bg-muted/30 border-transparent" : ""}`} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-mono text-muted-foreground">Why It Works (Analysis)</Label>
                  <Textarea 
                    value={formData.metadata?.whyItWorks || ""} 
                    onChange={(e) => handleMetadataChange("whyItWorks", e.target.value)} 
                    readOnly={!isEditing} 
                    className={`font-mono min-h-[80px] ${!isEditing ? "bg-muted/30 border-transparent" : ""}`} 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Properties */}
          <div className="w-full md:w-72 space-y-6">
            {/* Folder Organization */}
            <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                <FolderInput className="w-4 h-4 text-muted-foreground" /> Organization
              </h4>
              
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Folder</Label>
                <Select 
                  value={formData.folderId || "root"} 
                  onValueChange={(val) => setFormData({ ...formData, folderId: val })}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={`h-8 font-mono text-xs ${!isEditing ? "bg-muted/30 border-transparent" : ""}`}>
                    <SelectValue placeholder="Root Folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">Root (No Folder)</SelectItem>
                    {folders.map((f:any) => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Tags</Label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {(formData.tags || []).map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] font-mono flex items-center gap-1">
                      {tag}
                      {isEditing && (
                        <button onClick={() => removeTag(tag)} className="hover:text-destructive ml-1">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {(!formData.tags || formData.tags.length === 0) && <span className="text-xs text-muted-foreground">No tags</span>}
                </div>
                {isEditing && (
                  <Input 
                    placeholder="Add tag and press Enter" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={addTag}
                    className="h-8 font-mono text-xs"
                  />
                )}
              </div>
            </div>

            {/* Universal Metadata */}
            <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                <Star className="w-4 h-4 text-muted-foreground" /> Attributes
              </h4>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Confidence Score (0-100)</Label>
                <Input 
                  type="number"
                  min="0" max="100"
                  value={formData.metadata?.confidenceScore || 0} 
                  onChange={(e) => handleMetadataChange("confidenceScore", parseInt(e.target.value))}
                  readOnly={!isEditing}
                  className={`h-8 font-mono text-xs ${!isEditing ? "bg-muted/30 border-transparent" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Priority</Label>
                <Select 
                  value={formData.metadata?.priority || "Medium"} 
                  onValueChange={(val) => handleMetadataChange("priority", val)}
                  disabled={!isEditing}
                >
                  <SelectTrigger className={`h-8 font-mono text-xs ${!isEditing ? "bg-muted/30 border-transparent" : ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Highest", "High", "Medium", "Low", "Lowest"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Provider / Origin</Label>
                <Input 
                  value={formData.metadata?.provider || "Manual"} 
                  readOnly
                  className="h-8 font-mono text-xs bg-muted/30 border-transparent"
                />
              </div>
            </div>

            {/* Source Reference */}
            <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-4">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-muted-foreground" /> Source Info
              </h4>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Competitor Channel</Label>
                <Input 
                  value={formData.metadata?.competitorChannel || ""} 
                  onChange={(e) => handleMetadataChange("competitorChannel", e.target.value)}
                  readOnly={!isEditing}
                  placeholder="e.g. MrBeast"
                  className={`h-8 font-mono text-xs ${!isEditing ? "bg-muted/30 border-transparent" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Video URL</Label>
                <Input 
                  value={formData.metadata?.videoUrl || ""} 
                  onChange={(e) => handleMetadataChange("videoUrl", e.target.value)}
                  readOnly={!isEditing}
                  placeholder="https://youtube.com/..."
                  className={`h-8 font-mono text-xs ${!isEditing ? "bg-muted/30 border-transparent" : ""}`}
                />
              </div>
            </div>

            {/* Stats */}
            {!item.isNew && (
              <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-muted-foreground" /> History
                </h4>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-muted-foreground">Usage Count</span>
                  <span className="font-bold">{formData.metadata?.usageCount || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-muted-foreground">Assembly Count</span>
                  <span className="font-bold">{formData.metadata?.assemblyCount || 0}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(formData.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
