"use client";

import React, { useState } from "react";
import { useGenerator } from "../generator-context";
import { Button } from "@/components/ui/button";
import { Activity, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export function ScriptAnalysisModule() {
  const { project, setProject, setActiveTab } = useGenerator();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = async () => {
    if (!project.rawScript) {
      toast.error("Please import a script first.");
      return;
    }
    setIsAnalyzing(true);
    try {
      // Stub API call
      await new Promise(r => setTimeout(r, 1500));
      setProject(p => ({
        ...p,
        analysis: {
          hook: "A compelling opening statement that grabs attention.",
          storyStructure: "Three-act structure with a clear climax.",
          tone: "Informative and engaging.",
          audience: "Tech enthusiasts and creators.",
        }
      }));
      toast.success("Script analyzed successfully.");
    } catch (e) {
      toast.error("Analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Script Analysis
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              AI detects your story structure, tone, and audience.
            </p>
          </div>
          <Button onClick={runAnalysis} disabled={isAnalyzing || !project.rawScript}>
            {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            {project.analysis ? "Re-Analyze Script" : "Analyze Script"}
          </Button>
        </div>

        {!project.analysis && !isAnalyzing && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Activity className="w-8 h-8 text-muted-foreground" />
            </div>
            <h4 className="text-lg font-bold">No Analysis Yet</h4>
            <p className="text-sm text-muted-foreground max-w-sm mt-2">
              Run the analysis to extract metadata, tone, and structure from your script before generating prompts.
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-sm font-medium animate-pulse">Analyzing narrative flow and tone...</p>
          </div>
        )}

        {project.analysis && !isAnalyzing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(project.analysis).map(([key, value]) => (
              <div key={key} className="bg-muted/30 p-4 rounded-lg border">
                <h5 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h5>
                <p className="text-sm font-medium leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button 
            disabled={!project.analysis} 
            onClick={() => setActiveTab("breakdown")}
            className="font-bold"
          >
            Detect Scenes <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
