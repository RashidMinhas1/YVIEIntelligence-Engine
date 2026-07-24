"use client";

import React, { useState } from "react";
import { StudioProject, ResearchSource, ResearchCollection } from "@/lib/types/studio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Trash2, Wand2, Save } from "lucide-react";
import { toast } from "sonner";
import { useJob } from "@/hooks/use-job";
import { JobProgress } from "@/components/ui/job-progress";

interface ResearchPanelProps {
  project: StudioProject;
  setProject: React.Dispatch<React.SetStateAction<StudioProject>>;
}

export function ResearchPanel({ project, setProject }: ResearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [newSourceTitle, setNewSourceTitle] = useState("");

  const updateNotes = (notes: string) => {
    setProject(p => ({
      ...p,
      research: { ...p.research, notes },
      updatedAt: new Date().toISOString()
    }));
  };

  const addSource = () => {
    if (!newSourceTitle.trim()) return;
    const newSource: ResearchSource = {
      id: crypto.randomUUID(),
      title: newSourceTitle,
      url: newSourceUrl,
      notes: "",
      tags: [],
      addedAt: new Date().toISOString()
    };
    setProject(p => ({
      ...p,
      research: {
        ...p.research,
        sources: [newSource, ...(p.research.sources || [])]
      },
      updatedAt: new Date().toISOString()
    }));
    setNewSourceTitle("");
    setNewSourceUrl("");
  };

  const deleteSource = (id: string) => {
    setProject(p => ({
      ...p,
      research: {
        ...p.research,
        sources: (p.research.sources || []).filter(s => s.id !== id)
      },
      updatedAt: new Date().toISOString()
    }));
  };

  const updateSourceNotes = (id: string, notes: string) => {
    setProject(p => ({
      ...p,
      research: {
        ...p.research,
        sources: (p.research.sources || []).map(s => s.id === id ? { ...s, notes } : s)
      },
      updatedAt: new Date().toISOString()
    }));
  };

  const { job: summarizeJob, startPolling: pollSummarize, cancelJob: cancelSummarize } = useJob();
  const { job: generateJob, startPolling: pollGenerate, cancelJob: cancelGenerate } = useJob();
  
  const handleSummarizeSource = async (source: ResearchSource) => {
    if (!source.notes && !source.url) {
      toast.error("Source needs notes or a URL to summarize.");
      return;
    }
    try {
      const res = await fetch("/api/studio/research/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source })
      });
      const data = await res.json();
      if (data.jobId) pollSummarize(data.jobId);
    } catch (e) {
      toast.error("Failed to start summarization");
    }
  };

  const handleGenerateIdeas = async () => {
    if (!project.research.notes && !(project.research.sources || []).length) {
      toast.error("Add some research notes or sources first.");
      return;
    }
    try {
      const res = await fetch("/api/studio/research/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ research: project.research })
      });
      const data = await res.json();
      if (data.jobId) pollGenerate(data.jobId);
    } catch (e) {
      toast.error("Failed to start generation");
    }
  };

  // Apply summarize result
  React.useEffect(() => {
    if (summarizeJob?.status === "completed" && summarizeJob.result) {
      const result = summarizeJob.result as any;
      const summary = result.summary;
      const insights = result.insights || [];
      const insightText = `\n\n--- AI SUMMARY ---\n${summary}\n\nInsights:\n${insights.map((i: string) => `- ${i}`).join("\n")}`;
      updateNotes(insightText + "\n" + project.research.notes);
      toast.success("Summary generated and added to notes!");
    }
  }, [summarizeJob?.status]);

  // Apply generation result
  React.useEffect(() => {
    if (generateJob?.status === "completed" && generateJob.result) {
      const result = generateJob.result as any;
      const videoIdeas = result.videoIdeas || [];
      const hooks = result.hooks || [];
      const angles = result.angles || [];
      const ideasText = `\n\n--- AI IDEAS ---\nVideo Ideas:\n${videoIdeas.map((i: string) => `- ${i}`).join("\n")}\n\nHooks:\n${hooks.map((i: string) => `- ${i}`).join("\n")}\n\nAngles:\n${angles.map((i: string) => `- ${i}`).join("\n")}`;
      updateNotes(ideasText + "\n" + project.research.notes);
      toast.success("Ideas generated and added to notes!");
    }
  }, [generateJob?.status]);

  const saveToLibrary = async (source: ResearchSource) => {
    try {
      const res = await fetch("/api/library/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "research_note",
          title: source.title,
          content: { url: source.url, notes: source.notes, summary: source.summary },
          tags: source.tags
        })
      });
      if (res.ok) {
        toast.success("Saved to Universal Library!");
      } else {
        toast.error("Failed to save to library.");
      }
    } catch (e) {
      toast.error("Error saving to library.");
    }
  };

  const sources = project.research.sources || [];
  const filteredSources = sources.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.summary || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <Tabs defaultValue="notebook" className="flex-1 flex flex-col h-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-12 px-4 gap-4">
          <TabsTrigger value="notebook" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full">Notebook</TabsTrigger>
          <TabsTrigger value="sources" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full">Sources</TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="notebook" className="p-4 m-0 h-full flex flex-col">
            {generateJob && generateJob.status === "running" && (
              <div className="mb-4">
                <JobProgress job={generateJob} onCancel={cancelGenerate} title="Generating Ideas..." />
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-sm">Global Scratchpad</h3>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleGenerateIdeas}>
                <Wand2 className="w-3 h-3 mr-2" /> Generate Ideas
              </Button>
            </div>
            <Textarea 
              value={project.research.notes}
              onChange={(e) => updateNotes(e.target.value)}
              placeholder="Jot down quick thoughts, brainstorms, and unstructured research here..."
              className="min-h-[300px] flex-1 resize-none bg-background font-mono text-sm border-dashed"
            />
          </TabsContent>

          <TabsContent value="sources" className="p-4 m-0 space-y-6">
            {summarizeJob && summarizeJob.status === "running" && (
              <JobProgress job={summarizeJob} onCancel={cancelSummarize} title="Summarizing Research..." />
            )}
            
            <div className="space-y-3 bg-card p-4 rounded-lg border shadow-sm">
              <h4 className="text-sm font-medium">Add New Source</h4>
              <Input 
                placeholder="Source Title (e.g., 'Competitor Video', 'Article')" 
                value={newSourceTitle}
                onChange={e => setNewSourceTitle(e.target.value)}
                className="h-8 text-sm"
              />
              <Input 
                placeholder="URL (optional)" 
                value={newSourceUrl}
                onChange={e => setNewSourceUrl(e.target.value)}
                className="h-8 text-sm"
              />
              <Button size="sm" className="w-full" onClick={addSource}>
                <Plus className="w-4 h-4 mr-2" /> Add Source
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search sources..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>

            <div className="space-y-4">
              {filteredSources.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground py-8 border border-dashed rounded-md">
                  No sources found.
                </div>
              ) : (
                filteredSources.map(source => (
                  <div key={source.id} className="border rounded-lg bg-card overflow-hidden">
                    <div className="p-3 border-b bg-muted/30 flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{source.title}</h4>
                        {source.url && <a href={source.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">{source.url}</a>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={() => handleSummarizeSource(source)} title="AI Summarize">
                          <Wand2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={() => saveToLibrary(source)} title="Save to Library">
                          <Save className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-400" onClick={() => deleteSource(source.id)} title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-0">
                      <Textarea 
                        value={source.notes}
                        onChange={(e) => updateSourceNotes(source.id, e.target.value)}
                        placeholder="Raw notes, transcripts, or highlights..."
                        className="min-h-[100px] border-0 rounded-none focus-visible:ring-0 font-mono text-xs bg-transparent resize-y"
                      />
                    </div>
                    {source.summary && (
                      <div className="p-3 border-t bg-primary/5 text-sm">
                        <div className="font-medium text-xs text-primary mb-2 flex items-center"><Wand2 className="w-3 h-3 mr-1"/> AI Summary</div>
                        <p className="text-muted-foreground text-xs leading-relaxed">{source.summary}</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
