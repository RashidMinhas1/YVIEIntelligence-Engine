"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Zap } from "lucide-react";
import { ViralIntelligenceReport } from "@/lib/types/viral-intelligence";
import { useJob } from "@/hooks/use-job";
import { JobProgress } from "@/components/ui/job-progress";
import { AppLayout } from "@/components/app-layout";

export default function ViralIntelligenceDashboard() {
  const [titleInput, setTitleInput] = useState("");
  const [scriptInput, setScriptInput] = useState("");
  const [report, setReport] = useState<ViralIntelligenceReport | null>(null);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const { job, isPolling, startPolling, stopPolling, cancelJob, reset } = useJob(null, {
    onComplete: (result) => {
      setReport(result.report);
    },
    onError: (err) => {
      // The JobProgress component handles displaying the error.
    }
  });

  const handleAnalyze = async () => {
    if (!scriptInput.trim()) return;
    
    setDispatchError(null);
    setReport(null);
    reset();

    try {
      const res = await fetch("/api/intelligence/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptContent: scriptInput, videoTitle: titleInput }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to dispatch script analysis job");
      }

      const data = await res.json();
      startPolling(data.jobId);
    } catch (err: any) {
      setDispatchError(err.message);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Viral Intelligence Engine</h1>
          <p className="text-muted-foreground">
            Advanced multi-level scoring, Explainable AI insights, and Cross-Module Graph Analysis.
            Now upgraded with Senior Script Director capabilities.
          </p>
      </div>

      {!report && !isPolling && job?.status !== "failed" && job?.status !== "cancelled" && (
        <div className="space-y-4">
          <input 
            type="text"
            placeholder="Video Title (The Promise)"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
          />
          <Textarea 
            placeholder="Paste your script here for viral intelligence analysis..."
            className="min-h-[300px] font-mono text-sm bg-muted/50"
            value={scriptInput}
            onChange={(e) => setScriptInput(e.target.value)}
          />
          <Button 
            size="lg" 
            onClick={handleAnalyze} 
            disabled={!scriptInput.trim()}
            className="w-full sm:w-auto"
          >
            <Zap className="mr-2 h-4 w-4" />
            Run Intelligence Analysis
          </Button>

          {dispatchError && (
            <Alert variant="destructive">
              <AlertTitle>Dispatch Failed</AlertTitle>
              <AlertDescription>{dispatchError}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {(isPolling || job) && !report && (
        <JobProgress 
          job={job} 
          title="Running Intelligence Analysis..." 
          onCancel={cancelJob}
          onRetry={handleAnalyze}
        />
      )}

      {report && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <h2 className="text-2xl font-semibold">Analysis Results</h2>
             <Button variant="outline" onClick={() => { setReport(null); reset(); }}>Analyze Another</Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 border rounded-xl bg-card">
                <h2 className="text-2xl font-semibold mb-4">Overall Score: {report.metadata.overallViralScore}/100</h2>
                <p className="text-muted-foreground text-sm">Provider: {report.metadata.aiProvider}</p>
              </div>
              
              <div className="p-6 border rounded-xl bg-card">
                 <h3 className="text-lg font-semibold mb-2">Hook Intelligence</h3>
                 <p className="text-sm">{report.hook.coach.whyItMatters}</p>
                 <p className="text-sm font-bold mt-2">Score: {report.hook.rawScore} / 100</p>
              </div>
              
              <div className="p-6 border rounded-xl bg-card">
                 <h3 className="text-lg font-semibold mb-2">Title Intelligence</h3>
                 <p className="text-sm">{report.title.coach.whyItMatters}</p>
                 <p className="text-sm font-bold mt-2">Score: {report.title.rawScore} / 100</p>
              </div>
              
               <div className="p-6 border rounded-xl bg-card">
                 <h3 className="text-lg font-semibold mb-2">CTA Intelligence</h3>
                 <p className="text-sm">{report.cta.coach.whyItMatters}</p>
                 <p className="text-sm font-bold mt-2">Score: {report.cta.rawScore} / 100</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="p-6 border rounded-xl bg-card">
                <h3 className="text-lg font-semibold mb-4">Intelligence Graph</h3>
                <ul className="space-y-2">
                  {report.graph.edges.map((edge, i) => (
                    <li key={i} className="text-sm border-b pb-2">
                      <span className="font-semibold">{edge.sourceNode} → {edge.targetNode}</span>
                      <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                        edge.relationshipType === 'strong' ? 'bg-green-100 text-green-800' :
                        edge.relationshipType === 'conflicting' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {edge.relationshipType}
                      </span>
                      <p className="mt-1 text-muted-foreground">{edge.reason}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  );
}
