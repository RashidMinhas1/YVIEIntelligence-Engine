"use client";

import React from "react";
import { StudioProject } from "@/lib/types/studio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sparkles, Library, History, FileJson } from "lucide-react";

import { useJob } from "@/hooks/use-job";
import { JobProgress } from "@/components/ui/job-progress";
import { Wand2, RefreshCw } from "lucide-react";
import { toast } from "sonner";


interface AssistantPanelProps {
  project: StudioProject;
  setProject: React.Dispatch<React.SetStateAction<StudioProject>>;
}

export function AssistantPanel({ project, setProject }: AssistantPanelProps) {
  const { job, isPolling, startPolling, cancelJob, reset } = useJob(null, {
    onComplete: (result) => {
      setProject(p => ({ ...p, lastAnalysis: result.analysis }));
      toast.success("Analysis complete.");
    },
    onError: (err) => {
      toast.error(err || "Analysis failed.");
    }
  });

  const { job: timelineJob, isPolling: isPollingTimeline, startPolling: startPollingTimeline, cancelJob: cancelTimelineJob, reset: resetTimeline } = useJob(null, {
    onComplete: (result) => {
      setProject(p => ({ ...p, timelineAnalysis: result.analysis }));
      toast.success("Timeline Analysis complete.");
    },
    onError: (err) => {
      toast.error(err || "Timeline analysis failed.");
    }
  });

  const handleAnalyzeTimeline = async () => {
    if (isPollingTimeline) return;
    resetTimeline();

    try {
      const res = await fetch("/api/studio/storyboard/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: project.sections })
      });
      const data = await res.json();
      if (data.jobId) startPollingTimeline(data.jobId);
    } catch (err) {
      toast.error("Failed to start timeline analysis.");
    }
  };

  const handleAnalyze = async () => {
    if (isPolling) return;
    reset();

    const fullContext = project.sections.map(s => `${s.type}:\n${s.content}`).join("\n\n");

    try {
      const res = await fetch("/api/studio/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptContext: fullContext })
      });
      const data = await res.json();
      if (data.jobId) startPolling(data.jobId);
    } catch (err) {
      toast.error("Failed to start analysis.");
    }
  };

  return (
    <div className="flex flex-col h-full border-l bg-muted/10">
      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b bg-card">
          <h2 className="font-bold text-base"><Sparkles className="h-4 w-4 inline mr-1" /> AI Assistant</h2>
          <p className="text-xs text-muted-foreground">Live analysis of your script and storyboard.</p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-sm">Live Analysis</h3>
                <Button size="sm" variant="secondary" onClick={handleAnalyze} disabled={isPolling}>
                  {isPolling ? "Analyzing..." : "Analyze Script"}
                </Button>
              </div>
              
              {isPolling && job && (
                <div className="py-4">
                  <JobProgress job={job} onCancel={cancelJob} />
                </div>
              )}

              {!isPolling && project.lastAnalysis ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="border p-2 rounded bg-card">
                      <div className="text-muted-foreground mb-1">Retention</div>
                      <div className="text-lg font-bold">{project.lastAnalysis.retentionScore}/100</div>
                    </div>
                    <div className="border p-2 rounded bg-card">
                      <div className="text-muted-foreground mb-1">Emotional</div>
                      <div className="text-lg font-bold">{project.lastAnalysis.emotionalScore}/100</div>
                    </div>
                    <div className="border p-2 rounded bg-card">
                      <div className="text-muted-foreground mb-1">Curiosity</div>
                      <div className="text-lg font-bold">{project.lastAnalysis.curiosityScore}/100</div>
                    </div>
                    <div className="border p-2 rounded bg-card">
                      <div className="text-muted-foreground mb-1">SEO</div>
                      <div className="text-lg font-bold">{project.lastAnalysis.seoScore}/100</div>
                    </div>
                  </div>
                  <div className="text-xs space-y-1 mt-4">
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Word Count:</span>
                      <span className="font-medium">{project.lastAnalysis.wordCount}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Read Time:</span>
                      <span className="font-medium">{project.lastAnalysis.estimatedReadingTime}</span>
                    </div>
                    <div className="flex justify-between border-b pb-1">
                      <span className="text-muted-foreground">Readability:</span>
                      <span className="font-medium">{project.lastAnalysis.readability}</span>
                    </div>
                  </div>
                  {project.lastAnalysis.suggestions && project.lastAnalysis.suggestions.length > 0 && (
                    <div className="mt-4 border rounded p-3 bg-muted/20">
                      <h4 className="font-semibold text-xs mb-2">Suggestions</h4>
                      <ul className="list-disc pl-4 text-xs space-y-1 text-muted-foreground">
                        {project.lastAnalysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                !isPolling && (
                  <div className="text-xs text-muted-foreground p-4 text-center border rounded-md border-dashed">
                    Click analyze to score your script.
                  </div>
                )
              )}

              <hr className="my-6" />

              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-sm">Timeline Analysis</h3>
                <Button size="sm" variant="secondary" onClick={handleAnalyzeTimeline} disabled={isPollingTimeline}>
                  {isPollingTimeline ? "Analyzing..." : "Analyze Timeline"}
                </Button>
              </div>

              {isPollingTimeline && timelineJob && (
                <div className="py-4">
                  <JobProgress job={timelineJob} onCancel={cancelTimelineJob} />
                </div>
              )}

              {!isPollingTimeline && project.timelineAnalysis ? (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="border p-2 rounded bg-card">
                      <div className="text-muted-foreground mb-1">Watch Time</div>
                      <div className="text-sm font-bold">{project.timelineAnalysis.estimatedWatchTime}</div>
                    </div>
                    <div className="border p-2 rounded bg-card">
                      <div className="text-muted-foreground mb-1">Total Duration</div>
                      <div className="text-sm font-bold">{project.timelineAnalysis.totalDuration}s</div>
                    </div>
                    <div className="border p-2 rounded bg-card">
                      <div className="text-muted-foreground mb-1">Hook Strength</div>
                      <div className="text-sm font-bold">{project.timelineAnalysis.hookStrength}/100</div>
                    </div>
                    <div className="border p-2 rounded bg-card">
                      <div className="text-muted-foreground mb-1">Ending Strength</div>
                      <div className="text-sm font-bold">{project.timelineAnalysis.endingStrength}/100</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Retention Curve:</span>
                    <p className="mt-1">{project.timelineAnalysis.retentionCurve}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground font-semibold">Slow Sections:</span>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        {project.timelineAnalysis.slowSections?.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                    <div>
                      <span className="text-muted-foreground font-semibold">Fast Sections:</span>
                      <ul className="list-disc pl-4 mt-1 space-y-1">
                        {project.timelineAnalysis.fastSections?.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground font-semibold">Emotional Peaks:</span>
                    <ul className="list-disc pl-4 mt-1 space-y-1">
                      {project.timelineAnalysis.emotionalPeaks?.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                </div>
              ) : (
                !isPollingTimeline && (
                  <div className="text-xs text-muted-foreground p-4 text-center border rounded-md border-dashed">
                    Click analyze to score your storyboard and timeline.
                  </div>
                )
              )}
            </div>
        </ScrollArea>
      </div>
    </div>
  );
}
