"use client";

import React from "react";
import { StudioProject, ProductionData } from "@/lib/types/studio";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, FileIcon, Save, RefreshCw, FileText, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useJob } from "@/hooks/use-job";
import { JobProgress } from "@/components/ui/job-progress";

interface ThumbnailPanelProps {
  project: StudioProject;
  setProject: React.Dispatch<React.SetStateAction<StudioProject>>;
}

export function ThumbnailPanel({ project, setProject }: ThumbnailPanelProps) {
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
      if (result.thumbnails) updateProduction({ thumbnails: result.thumbnails });
      if (result.thumbnail) {
        const updatedThumbnails = (project.production?.thumbnails || []).map(t => 
          t.id === result.thumbnail.id ? result.thumbnail : t
        );
        updateProduction({ thumbnails: updatedThumbnails });
      }
      toast.success("Thumbnail action complete.");
    },
    onError: (err) => {
      toast.error(err || "Thumbnail action failed.");
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
      <div className="p-4 border-b border-border/40 flex justify-between items-center bg-card shadow-sm shrink-0">
        <div>
          <h2 className="font-bold text-xl flex items-center gap-2"><ImageIcon className="w-5 h-5 text-primary"/> Thumbnail AI</h2>
          <p className="text-sm text-muted-foreground mt-1">Generate, analyze, and preview concepts.</p>
        </div>
        <Button size="lg" onClick={() => triggerAction("generate_thumbnail")} className="rounded-xl font-bold shadow-sm h-12 px-6">
          <Sparkles className="w-5 h-5 mr-2" /> Generate Concepts
        </Button>
      </div>

      <ScrollArea className="flex-1 p-6 md:p-8 bg-muted/10">
        {isPolling && job && (
          <div className="mb-8">
            <JobProgress job={job} onCancel={cancelJob} />
          </div>
        )}

        <div className="max-w-4xl mx-auto space-y-6">
          {production.thumbnails.length === 0 ? (
            <div className="text-sm font-medium text-muted-foreground border-dashed border-2 border-border/60 p-16 rounded-3xl text-center bg-card shadow-sm">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              No concepts generated yet. Click <span className="font-bold text-foreground">Generate Concepts</span> to start.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {production.thumbnails.map((thumb) => (
                <div key={thumb.id} className="border border-border/60 p-6 rounded-3xl bg-card shadow-sm space-y-6 relative hover:shadow-md transition-shadow">
                  <div>
                    <div className="font-black text-2xl mb-4">{thumb.title}</div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm font-bold my-4">
                      <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl flex items-center justify-between">
                        <span className="text-muted-foreground uppercase tracking-wider text-xs">CTR</span>
                        <span className="text-primary text-lg">{thumb.ctrScore}/100</span>
                      </div>
                      <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl flex items-center justify-between">
                        <span className="text-muted-foreground uppercase tracking-wider text-xs">Curiosity</span>
                        <span className="text-primary text-lg">{thumb.curiosityScore}/100</span>
                      </div>
                      <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl flex items-center justify-between">
                        <span className="text-muted-foreground uppercase tracking-wider text-xs">Emotion</span>
                        <span className="text-primary text-lg">{thumb.emotionScore}/100</span>
                      </div>
                    </div>

                    <div className="text-sm space-y-2 bg-muted/20 p-4 rounded-xl border border-border/40">
                      <div><span className="font-bold text-muted-foreground uppercase text-xs tracking-wider mr-2">Hook:</span> {thumb.visualHook}</div>
                      <div><span className="font-bold text-muted-foreground uppercase text-xs tracking-wider mr-2">Subject:</span> {thumb.mainSubject} &bull; <span className="font-bold text-muted-foreground uppercase text-xs tracking-wider mx-1">Exp:</span> {thumb.faceExpression}</div>
                      <div><span className="font-bold text-muted-foreground uppercase text-xs tracking-wider mr-2">Background:</span> {thumb.background} &bull; <span className="font-bold text-muted-foreground uppercase text-xs tracking-wider mx-1">Palette:</span> {thumb.colorPalette}</div>
                      <div><span className="font-bold text-muted-foreground uppercase text-xs tracking-wider mr-2">Angle:</span> {thumb.cameraAngle} &bull; <span className="font-bold text-muted-foreground uppercase text-xs tracking-wider mx-1">Text:</span> {thumb.textPlacement}</div>
                    </div>
                  </div>

                  <div className="border-t border-border/40 pt-4 flex flex-wrap gap-3">
                    <Button size="sm" variant="outline" className="rounded-lg bg-card hover:bg-muted font-semibold" onClick={() => triggerAction("generate_thumbnail_prompt", { thumbnail: thumb })}>
                      <Sparkles className="w-4 h-4 mr-2 text-primary" /> Generate AI Prompt
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg bg-card hover:bg-muted font-semibold" onClick={() => triggerAction("analyze_thumbnail_quality", { thumbnail: thumb })}>
                      <RefreshCw className="w-4 h-4 mr-2" /> Analyze Quality
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg bg-card hover:bg-muted font-semibold" onClick={() => triggerAction("generate_thumbnail_preview", { thumbnail: thumb })}>
                      <FileIcon className="w-4 h-4 mr-2" /> Generate Preview
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-lg bg-card hover:bg-muted font-semibold" onClick={() => toast.success("Template saved to Universal Library")}>
                      <Save className="w-4 h-4 mr-2" /> Save Template
                    </Button>
                  </div>

                  {thumb.readinessScore && (
                    <div className="bg-background p-4 rounded-xl text-sm space-y-3 border border-border/60 shadow-inner">
                      <div className="font-black text-primary border-b border-border/40 pb-2 uppercase tracking-wider text-xs">Readiness Score: {thumb.readinessScore.overallScore}/100</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-medium">
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">CTR Potential</span> <span>{thumb.readinessScore.ctrPotential}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Curiosity</span> <span>{thumb.readinessScore.curiosity}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Emotional Impact</span> <span>{thumb.readinessScore.emotionalImpact}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Visual Simplicity</span> <span>{thumb.readinessScore.visualSimplicity}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Text Readability</span> <span>{thumb.readinessScore.textReadability}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Mobile Visibility</span> <span>{thumb.readinessScore.mobileVisibility}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Color Contrast</span> <span>{thumb.readinessScore.colorContrast}</span></div>
                        <div className="flex justify-between items-center"><span className="text-muted-foreground">Face Visibility</span> <span>{thumb.readinessScore.faceVisibility}</span></div>
                      </div>
                    </div>
                  )}

                  {thumb.imagePrompt && (
                    <div className="bg-primary/5 p-5 rounded-xl text-sm space-y-4 font-mono border border-primary/20 shadow-inner">
                      <div className="flex justify-between items-center border-b border-primary/20 pb-2">
                        <div className="font-black text-primary uppercase tracking-wider text-xs">Visual Brief & AI Prompt</div>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10" onClick={() => {
                          navigator.clipboard.writeText(`Prompt: ${thumb.imagePrompt}\nNegative: ${thumb.negativePrompt || ""}`);
                          toast.success("Prompt copied to clipboard");
                        }}>
                          <FileText className="h-4 w-4 text-primary" />
                        </Button>
                      </div>
                      <div className="leading-relaxed">
                        <span className="font-bold text-foreground">Prompt: </span>
                        <span className="text-muted-foreground">{thumb.imagePrompt}</span>
                      </div>
                      {thumb.negativePrompt && (
                        <div className="leading-relaxed">
                          <span className="font-bold text-destructive/90">Negative: </span>
                          <span className="text-muted-foreground">{thumb.negativePrompt}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-primary/10 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <div><span className="text-foreground">Ratio:</span> {thumb.aspectRatio || "16:9"}</div>
                        <div><span className="text-foreground">Style:</span> {thumb.style || "N/A"}</div>
                        <div><span className="text-foreground">Lighting:</span> {thumb.lighting || "N/A"}</div>
                        <div><span className="text-foreground">Lens:</span> {thumb.cameraLens || "N/A"}</div>
                      </div>
                    </div>
                  )}

                  {thumb.generatedImageUrl && (
                    <div className="mt-6 pt-6 border-t border-border/40">
                      <div className="text-sm font-black mb-3 uppercase tracking-wider text-muted-foreground">Preview Image</div>
                      <img src={thumb.generatedImageUrl} alt="Thumbnail Preview" className="w-full max-w-2xl rounded-2xl border-2 border-border/60 shadow-sm aspect-video object-cover hover:shadow-lg transition-shadow" />
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
