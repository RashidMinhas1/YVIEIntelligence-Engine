"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function VideoIdeasView() {
  const queryClient = useQueryClient();
  const [ideaName, setIdeaName] = useState("");
  const [selectedTitleId, setSelectedTitleId] = useState("none");
  const [editedTitle, setEditedTitle] = useState("");
  const [selectedScriptId, setSelectedScriptId] = useState("none");
  const [editedScript, setEditedScript] = useState("");
  const [ideaNotes, setIdeaNotes] = useState("");
  const [expandedIdeaId, setExpandedIdeaId] = useState<string | null>(null);

  // Fetch ideas
  const { data: ideasData } = useQuery({
    queryKey: ["video-ideas"],
    queryFn: async () => {
      const res = await fetch("/api/library/video-ideas");
      return res.json();
    },
  });

  // Fetch available templates
  const { data: libraryItemsData } = useQuery({
    queryKey: ["library-items"],
    queryFn: async () => {
      const res = await fetch("/api/library/items");
      return res.json();
    },
  });

  const titles = libraryItemsData?.items?.filter((i:any) => i.type === "title") || [];
  const scripts = libraryItemsData?.items?.filter((i:any) => i.type === "script") || [];
  const ideas = ideasData?.ideas || [];

  const handleTitleSelect = (val: string) => {
    setSelectedTitleId(val);
    if (val !== "none") {
      const t = titles.find((x:any) => x.id === val);
      if (t) {
        setEditedTitle(t.content?.template || t.title || "");
      }
    }
  };

  const handleScriptSelect = (val: string) => {
    setSelectedScriptId(val);
    if (val !== "none") {
      const s = scripts.find((x:any) => x.id === val);
      if (s) {
        let content = `--- ${s.title} ---\n`;
        const c = s.content || {};
        
        if (c.storytellingFramework) content += `Framework: ${c.storytellingFramework}\n\n`;
        if (c.hookSection) content += `[HOOK]\n${c.hookSection}\n\n`;
        if (c.bodySection) content += `[BODY]\n${c.bodySection}\n\n`;
        if (c.ctaSection) content += `[CTA]\n${c.ctaSection}\n\n`;
        
        if (c.hookFormula) content += `Hook Formula: ${c.hookFormula}\n\n`;
        if (c.introStructure) content += `Intro Structure: ${c.introStructure}\n\n`;
        if (c.storyFlow) content += `Story Flow: ${c.storyFlow}\n\n`;
        if (c.retentionPattern) content += `Retention Pattern: ${c.retentionPattern}\n\n`;
        if (c.curiosityLoops && Array.isArray(c.curiosityLoops)) content += `Curiosity Loops:\n${c.curiosityLoops.map((l:any)=>`- ${l}`).join('\n')}\n\n`;
        if (c.emotionalBeats && Array.isArray(c.emotionalBeats)) content += `Emotional Beats:\n${c.emotionalBeats.map((b:any)=>`- ${b}`).join('\n')}\n\n`;
        if (c.ctaPlacement) content += `CTA Placement: ${c.ctaPlacement}\n\n`;
        if (c.exampleStructure) content += `Example:\n${c.exampleStructure}\n`;

        setEditedScript(content.trim());
      }
    }
  };

  const deleteIdea = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/library/video-ideas?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete idea");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-ideas"] });
      toast.success("Video idea deleted!");
    },
    onError: () => toast.error("Failed to delete idea"),
  });

  const saveIdea = useMutation({
    mutationFn: async () => {
      const payload = {
        name: ideaName.trim(),
        selectedTitleFormatId: selectedTitleId === "none" ? null : selectedTitleId,
        editedTitle: editedTitle.trim(),
        selectedScriptFormatId: selectedScriptId === "none" ? null : selectedScriptId,
        editedScript: editedScript.trim(),
        notes: ideaNotes.trim() || undefined,
      };
      
      const res = await fetch("/api/library/video-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save idea");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-ideas"] });
      toast.success("Video idea saved!");
      setIdeaName("");
      setSelectedTitleId("none");
      setEditedTitle("");
      setSelectedScriptId("none");
      setEditedScript("");
      setIdeaNotes("");
    },
    onError: () => toast.error("Failed to save idea"),
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor Side */}
      <div className="space-y-6">
        <div className="bg-card rounded-xl border border-border p-5 space-y-5">
          <div>
            <h3 className="text-lg font-bold font-mono">New Video Idea</h3>
            <p className="text-xs text-muted-foreground font-mono">Mix and match templates from your library</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase text-muted-foreground">Internal Name / Topic</Label>
            <Input 
              value={ideaName} 
              onChange={(e) => setIdeaName(e.target.value)} 
              placeholder="e.g. Q4 Marketing Strategy" 
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-muted/20 border border-border">
            <Label className="text-xs font-mono uppercase font-bold flex items-center gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center bg-primary/20 text-primary">1</span> 
              Title Strategy
            </Label>
            
            <Select value={selectedTitleId} onValueChange={handleTitleSelect}>
              <SelectTrigger className="w-full text-sm font-mono bg-background">
                <SelectValue placeholder="Import a title format..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-muted-foreground italic">Start from scratch</SelectItem>
                {titles.map((t:any) => (
                  <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input 
              value={editedTitle} 
              onChange={(e) => setEditedTitle(e.target.value)} 
              placeholder={selectedTitleId !== "none" ? "Edit the template for this specific video..." : "Write your title here..."} 
              className="font-mono text-sm bg-background border-primary/30 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-3 p-4 rounded-lg bg-muted/20 border border-border">
            <Label className="text-xs font-mono uppercase font-bold flex items-center gap-2">
              <span className="w-5 h-5 rounded flex items-center justify-center bg-primary/20 text-primary">2</span> 
              Script Strategy
            </Label>
            
            <Select value={selectedScriptId} onValueChange={handleScriptSelect}>
              <SelectTrigger className="w-full text-sm font-mono bg-background">
                <SelectValue placeholder="Import a script framework..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none" className="text-muted-foreground italic">Start from scratch</SelectItem>
                {scripts.map((s:any) => (
                  <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Textarea 
              value={editedScript} 
              onChange={(e) => setEditedScript(e.target.value)} 
              placeholder={selectedScriptId !== "none" ? "Flesh out the framework for this video..." : "Write your script outline here..."} 
              className="font-mono text-sm min-h-[150px] resize-y bg-background border-primary/30 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-mono uppercase text-muted-foreground">Notes & Research</Label>
            <Textarea 
              value={ideaNotes} 
              onChange={(e) => setIdeaNotes(e.target.value)} 
              placeholder="Competitor links, key points, sponsorships..." 
              className="font-mono text-sm"
            />
          </div>

          <Button 
            className="w-full font-mono font-bold" 
            disabled={!ideaName.trim() || saveIdea.isPending}
            onClick={() => saveIdea.mutate()}
          >
            {saveIdea.isPending ? "Saving..." : "Save Video Idea"}
          </Button>
        </div>
      </div>

      {/* List Side */}
      <div className="bg-card rounded-xl border border-border p-0 flex flex-col h-[800px]">
        <div className="p-4 border-b border-border bg-muted/10">
          <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-foreground">Saved Ideas</h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {ideas.length === 0 && (
            <div className="text-center py-10 text-xs font-mono text-muted-foreground border border-dashed rounded-lg">
              No video ideas saved yet.
            </div>
          )}

          {ideas.map((idea: any) => (
            <div key={idea.id} className="border border-border rounded-lg bg-background overflow-hidden">
              <button 
                onClick={() => setExpandedIdeaId(expandedIdeaId === idea.id ? null : idea.id)}
                className="w-full p-4 flex items-start justify-between text-left hover:bg-muted/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Video className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground font-mono">{idea.name}</h4>
                    <p className="text-xs text-muted-foreground font-mono line-clamp-1 mt-1">{idea.editedTitle || "No title set"}</p>
                  </div>
                </div>
                {expandedIdeaId === idea.id ? <ChevronDown className="w-4 h-4 text-muted-foreground mt-1" /> : <ChevronRight className="w-4 h-4 text-muted-foreground mt-1" />}
              </button>

              {expandedIdeaId === idea.id && (
                <div className="p-4 border-t border-border/50 bg-muted/5 space-y-4">
                  {idea.editedTitle && (
                    <div>
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground mb-1 block">Title</Label>
                      <div className="p-2 bg-background rounded border border-border text-sm font-mono text-foreground">{idea.editedTitle}</div>
                    </div>
                  )}
                  {idea.editedScript && (
                    <div>
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground mb-1 block">Script / Outline</Label>
                      <div className="p-2 bg-background rounded border border-border text-xs font-mono text-foreground whitespace-pre-wrap max-h-40 overflow-y-auto">{idea.editedScript}</div>
                    </div>
                  )}
                  {idea.notes && (
                    <div>
                      <Label className="text-[10px] font-mono uppercase text-muted-foreground mb-1 block">Notes</Label>
                      <div className="p-2 bg-background rounded border border-border text-xs font-mono text-muted-foreground whitespace-pre-wrap">{idea.notes}</div>
                    </div>
                  )}
                  <div className="flex justify-end gap-2 pt-2">
                     <Button variant="outline" size="sm" className="h-7 text-[10px] font-mono text-destructive hover:bg-destructive hover:text-white" onClick={(e) => {
                        e.stopPropagation();
                        deleteIdea.mutate(idea.id);
                     }} disabled={deleteIdea.isPending}>
                        <Trash2 className="w-3 h-3 mr-1" /> Delete
                     </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
