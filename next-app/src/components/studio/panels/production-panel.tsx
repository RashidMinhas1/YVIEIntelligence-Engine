"use client";

import React, { useState } from "react";
import { StudioProject, ProductionData } from "@/lib/types/studio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useJob } from "@/hooks/use-job";
import { JobProgress } from "@/components/ui/job-progress";
import { Download, Save, RefreshCw, Sparkles, CheckCircle2, XCircle, FileText, FileJson, FileIcon } from "lucide-react";

interface ProductionPanelProps {
  project: StudioProject;
  setProject: React.Dispatch<React.SetStateAction<StudioProject>>;
}

export function ProductionPanel({ project, setProject }: ProductionPanelProps) {
  const [activeTab, setActiveTab] = useState<"dashboard" | "titles" | "description" | "tags" | "chapters" | "checklist">("dashboard");

  const updateProduction = (newData: Partial<ProductionData>) => {
    setProject(p => ({
      ...p,
      production: {
        ...(p.production || { thumbnails: [], titles: [], chapters: [], editingChecklist: [] }),
        ...newData
      }
    }));
  };



  const { job, isPolling, startPolling, cancelJob, reset } = useJob(null, {
    onComplete: (result) => {
      // The result contains the specific generated asset based on action
      if (result.thumbnails) updateProduction({ thumbnails: result.thumbnails });
      if (result.thumbnail) {
        const updatedThumbnails = (project.production?.thumbnails || []).map(t => 
          t.id === result.thumbnail.id ? result.thumbnail : t
        );
        updateProduction({ thumbnails: updatedThumbnails });
      }
      if (result.titles) updateProduction({ titles: result.titles });
      if (result.description) updateProduction({ description: result.description });
      if (result.tags) updateProduction({ tags: result.tags });
      if (result.chapters) updateProduction({ chapters: result.chapters });
      if (result.editingChecklist) updateProduction({ editingChecklist: result.editingChecklist });
      if (result.readinessScore) updateProduction({ readinessScore: result.readinessScore });
      toast.success("Generation complete.");
    },
    onError: (err) => {
      toast.error(err || "Generation failed.");
    }
  });

  const triggerAction = async (actionPath: string, payload: any = {}) => {
    if (isPolling) return;
    reset();
    try {
      const res = await fetch(`/api/studio/production`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionPath, projectId: project.id, sections: project.sections, ...payload })
      });
      const data = await res.json();
      if (data.jobId) startPolling(data.jobId);
    } catch (err) {
      toast.error("Action failed.");
    }
  };

  const production = project.production || { thumbnails: [], titles: [], chapters: [], editingChecklist: [] };

  return (
    <div className="flex flex-col h-full bg-background border-r">
      <div className="p-4 border-b border-border/40 flex justify-between items-center bg-card shadow-sm flex-wrap gap-4 shrink-0">
        <div className="flex bg-muted p-1 rounded-xl shadow-inner overflow-x-auto custom-scrollbar">
          <Button variant={activeTab === "dashboard" ? "secondary" : "ghost"} size="sm" onClick={() => setActiveTab("dashboard")} className={`rounded-lg ${activeTab === "dashboard" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Dashboard</Button>
          <Button variant={activeTab === "titles" ? "secondary" : "ghost"} size="sm" onClick={() => setActiveTab("titles")} className={`rounded-lg ${activeTab === "titles" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Titles</Button>
          <Button variant={activeTab === "description" ? "secondary" : "ghost"} size="sm" onClick={() => setActiveTab("description")} className={`rounded-lg ${activeTab === "description" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Description</Button>
          <Button variant={activeTab === "tags" ? "secondary" : "ghost"} size="sm" onClick={() => setActiveTab("tags")} className={`rounded-lg ${activeTab === "tags" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Tags</Button>
          <Button variant={activeTab === "chapters" ? "secondary" : "ghost"} size="sm" onClick={() => setActiveTab("chapters")} className={`rounded-lg ${activeTab === "chapters" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Chapters</Button>
          <Button variant={activeTab === "checklist" ? "secondary" : "ghost"} size="sm" onClick={() => setActiveTab("checklist")} className={`rounded-lg ${activeTab === "checklist" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>Checklist</Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("Preset saved to Library!")} className="rounded-lg h-9 border-border/60">
            <Save className="w-4 h-4 mr-2 text-muted-foreground" /> Save Preset
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6 md:p-8 bg-muted/10">
        {isPolling && job && (
          <div className="mb-8">
            <JobProgress job={job} onCancel={cancelJob} />
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">Production Quality Score</h3>
                  <p className="text-sm text-muted-foreground mt-1">Evaluates all generated assets for readiness.</p>
                </div>
                <Button size="sm" onClick={() => triggerAction("analyze_production", { production })} className="rounded-lg h-10 px-4">
                  <RefreshCw className="w-4 h-4 mr-2" /> Refresh Score
                </Button>
              </div>

              {production.readinessScore ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="border border-border/60 p-5 rounded-2xl bg-card text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-3xl font-black text-primary">{production.readinessScore.overallScore}/100</div>
                      <div className="text-sm font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Overall</div>
                    </div>
                    <div className="border border-border/60 p-5 rounded-2xl bg-card text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold">{production.readinessScore.thumbnailScore}/100</div>
                      <div className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Thumbnail</div>
                    </div>
                    <div className="border border-border/60 p-5 rounded-2xl bg-card text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold">{production.readinessScore.titleScore}/100</div>
                      <div className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">Title</div>
                    </div>
                    <div className="border border-border/60 p-5 rounded-2xl bg-card text-center shadow-sm hover:shadow-md transition-shadow">
                      <div className="text-2xl font-bold">{production.readinessScore.seoScore}/100</div>
                      <div className="text-xs font-semibold text-muted-foreground mt-1 uppercase tracking-wider">SEO</div>
                    </div>
                  </div>
                  <div className="border border-border/60 p-5 rounded-xl bg-card text-sm shadow-sm flex items-center gap-3">
                    <span className="font-semibold text-base">Status:</span>
                    <span className="px-3 py-1 bg-primary/10 text-primary font-bold rounded-lg">{production.readinessScore.publishingReadiness}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="border border-border/60 p-6 rounded-2xl bg-card shadow-sm">
                      <h4 className="font-bold text-base mb-3 flex items-center gap-2"><XCircle className="w-5 h-5 text-destructive"/> Missing Assets</h4>
                      <ul className="list-disc pl-5 text-muted-foreground space-y-1.5">
                        {production.readinessScore.missingAssets.map((a, i) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                  <div className="border border-border/60 p-6 rounded-2xl bg-card shadow-sm">
                    <h4 className="font-bold text-base mb-3 flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary"/> Suggestions</h4>
                    <ul className="list-disc pl-5 text-muted-foreground space-y-1.5">
                      {production.readinessScore.improvementSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm font-medium text-muted-foreground border-dashed border-2 border-border/60 p-12 rounded-2xl text-center bg-card">
                Click <span className="font-bold text-foreground">Refresh Score</span> to intelligently evaluate your production assets.
              </div>
            )}
          </div>
        )}

        {/* Titles Tab */}
        {activeTab === "titles" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Optimized Titles</h3>
              <Button size="sm" onClick={() => triggerAction("generate_titles")} className="rounded-lg h-10 px-4">
                <Sparkles className="w-4 h-4 mr-2 text-primary-foreground" /> Generate Titles
              </Button>
            </div>
            <div className="space-y-4">
              {production.titles.map((t) => (
                <div key={t.id} className="border border-border/60 p-5 rounded-2xl flex justify-between items-center bg-card shadow-sm hover:shadow-md transition-all group">
                  <div>
                    <div className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{t.title}</div>
                    <div className="text-xs font-semibold text-muted-foreground mt-2 space-x-4 flex items-center">
                      <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> SEO: {t.seoScore}</span>
                      <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5"/> Click: {t.clickPotential}</span>
                      <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5"/> Chars: {t.characterCount}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-lg border-primary/20 hover:bg-primary/5 hover:text-primary">Select</Button>
                </div>
              ))}
              {production.titles.length === 0 && (
                <div className="text-sm font-medium text-muted-foreground border-dashed border-2 border-border/60 p-12 rounded-2xl text-center bg-card">
                  No titles generated yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Description Tab */}
        {activeTab === "description" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Smart Description</h3>
              <Button size="sm" onClick={() => triggerAction("generate_description")} className="rounded-lg h-10 px-4">
                <Sparkles className="w-4 h-4 mr-2" /> Generate Description
              </Button>
            </div>
            {production.description ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold tracking-wide uppercase text-muted-foreground">Short / Hook</label>
                  <Textarea value={production.description.short} readOnly className="h-20 text-base leading-relaxed bg-card rounded-xl border-border/60 shadow-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold tracking-wide uppercase text-muted-foreground">Full Description</label>
                  <Textarea value={production.description.full} readOnly className="h-64 text-base leading-relaxed bg-card rounded-xl border-border/60 shadow-sm custom-scrollbar" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold tracking-wide uppercase text-muted-foreground">Call To Action</label>
                  <Input value={production.description.cta} readOnly className="text-base h-12 bg-card rounded-xl border-border/60 shadow-sm" />
                </div>
              </div>
            ) : (
              <div className="text-sm font-medium text-muted-foreground border-dashed border-2 border-border/60 p-12 rounded-2xl text-center bg-card">
                  No description generated yet.
              </div>
            )}
          </div>
        )}

        {/* Tags Tab */}
        {activeTab === "tags" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">SEO Tags & Keywords</h3>
              <Button size="sm" onClick={() => triggerAction("generate_tags")} className="rounded-lg h-10 px-4">
                <Sparkles className="w-4 h-4 mr-2" /> Generate Tags
              </Button>
            </div>
            {production.tags ? (
              <div className="space-y-8">
                <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm">
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary"/> YouTube Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {production.tags.youtubeTags.map(t => <span key={t} className="bg-primary/10 text-primary font-semibold text-sm px-3 py-1.5 rounded-lg border border-primary/20">{t}</span>)}
                  </div>
                </div>
                <div className="bg-card p-6 rounded-2xl border border-border/60 shadow-sm">
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-secondary-foreground"/> Search Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {production.tags.searchKeywords.map(t => <span key={t} className="bg-secondary text-secondary-foreground font-semibold text-sm px-3 py-1.5 rounded-lg border border-border">{t}</span>)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm font-medium text-muted-foreground border-dashed border-2 border-border/60 p-12 rounded-2xl text-center bg-card">
                  No tags generated yet.
              </div>
            )}
          </div>
        )}

        {/* Chapters Tab */}
        {activeTab === "chapters" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Timestamp Chapters</h3>
              <Button size="sm" onClick={() => triggerAction("generate_chapters")} className="rounded-lg h-10 px-4">
                <Sparkles className="w-4 h-4 mr-2" /> Generate Chapters
              </Button>
            </div>
            {production.chapters.length > 0 ? (
              <div className="space-y-3">
                {production.chapters.map(c => (
                  <div key={c.id} className="border border-border/60 p-4 rounded-xl flex gap-5 text-sm bg-card shadow-sm hover:shadow-md transition-shadow">
                    <div className="font-mono text-primary font-bold bg-primary/10 px-2 py-1 rounded-md h-fit">{c.time}</div>
                    <div className="flex-1">
                      <div className="font-bold text-base text-foreground">{c.title}</div>
                      <div className="text-sm text-muted-foreground mt-1">{c.summary}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm font-medium text-muted-foreground border-dashed border-2 border-border/60 p-12 rounded-2xl text-center bg-card">
                  No chapters generated yet.
              </div>
            )}
          </div>
        )}

        {/* Checklist Tab */}
        {activeTab === "checklist" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Smart Editing Checklist</h3>
              <Button size="sm" onClick={() => triggerAction("generate_checklist")} className="rounded-lg h-10 px-4">
                <Sparkles className="w-4 h-4 mr-2" /> Extract Checklist
              </Button>
            </div>
            {production.editingChecklist.length > 0 ? (
              <div className="space-y-3">
                {production.editingChecklist.map((item, idx) => (
                  <div key={item.id} className={`flex items-start gap-4 border border-border/60 p-4 rounded-xl text-sm bg-card shadow-sm transition-all ${item.completed ? "opacity-60 bg-muted/30" : "hover:shadow-md"}`}>
                    <div 
                      className="cursor-pointer text-muted-foreground hover:text-primary mt-0.5"
                      onClick={() => {
                        const newChecklist = [...production.editingChecklist];
                        newChecklist[idx].completed = !newChecklist[idx].completed;
                        updateProduction({ editingChecklist: newChecklist });
                      }}
                    >
                      {item.completed ? <CheckCircle2 className="w-6 h-6 text-primary" /> : <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 hover:border-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="uppercase text-[10px] font-black text-muted-foreground bg-muted px-2 py-1 rounded-md tracking-wider border border-border/50">{item.category}</span>
                      </div>
                      <div className={`text-base font-medium ${item.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm font-medium text-muted-foreground border-dashed border-2 border-border/60 p-12 rounded-2xl text-center bg-card">
                  No editing checklist generated yet.
              </div>
            )}
          </div>
        )}
        </div>

      </ScrollArea>
    </div>
  );
}
