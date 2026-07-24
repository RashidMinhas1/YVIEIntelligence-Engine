"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Save, Zap } from "lucide-react";
import { OptimizationVariant } from "@/lib/types/viral-intelligence";
import { useJob } from "@/hooks/use-job";
import { JobProgress } from "@/components/ui/job-progress";

interface OptimizationSandboxProps {
  moduleType: string;
  originalText: string;
  scriptContext: string;
}

export function OptimizationSandbox({ moduleType, originalText, scriptContext }: OptimizationSandboxProps) {
  const [variants, setVariants] = useState<OptimizationVariant[]>([]);
  const [instruction, setInstruction] = useState("");
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  const { job, isPolling: isGenerating, startPolling, stopPolling, cancelJob, reset: resetJob } = useJob(null, {
    onComplete: (result) => {
      const newVariant: OptimizationVariant = {
        id: Math.random().toString(36).substring(7),
        moduleType,
        originalText,
        optimizedText: result.variant.optimizedText,
        reasonForChange: result.variant.reasonForChange,
        expectedImprovement: result.variant.expectedImprovement,
        savedToLibrary: false,
        createdAt: new Date().toISOString()
      };
      setVariants(prev => [...prev, newVariant]);
    },
    onError: (err) => {
      setDispatchError(err);
    }
  });

  const generateVariant = async () => {
    if (!instruction.trim()) return;
    
    setDispatchError(null);
    resetJob();

    try {
      const res = await fetch("/api/intelligence/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleType,
          originalText,
          scriptContext,
          specificInstruction: instruction
        })
      });

      if (!res.ok) throw new Error("Failed to dispatch optimization job");
      const data = await res.json();
      startPolling(data.jobId);
      
    } catch (e: any) {
      setDispatchError(e.message || "An error occurred");
    }
  };

  return (
    <div className="space-y-4 border rounded-xl p-4 bg-muted/20">
      <h4 className="font-semibold text-lg flex items-center">
        Optimization Sandbox ({moduleType})
      </h4>
      
      <div className="flex gap-2">
        <input 
          type="text"
          className="flex-1 px-3 py-2 border rounded-md text-sm bg-background"
          placeholder="e.g. Make it more mysterious"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
        />
        <Button onClick={generateVariant} disabled={isGenerating || !instruction.trim()}>
          <Zap className="w-4 h-4 mr-2" /> Optimize
        </Button>
      </div>

      {(isGenerating || job) && (
        <div className="mt-4">
          <JobProgress 
            job={job} 
            title="Optimizing Module..." 
            onCancel={cancelJob}
            onRetry={generateVariant}
          />
        </div>
      )}

      {dispatchError && (
        <p className="text-sm text-red-500 mt-2">{dispatchError}</p>
      )}

      <div className="space-y-4 mt-4">
        {variants.map(v => (
          <div key={v.id} className="border rounded-lg bg-card p-4 space-y-3 relative">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Original</span>
                <p className="text-sm mt-1 bg-red-50 dark:bg-red-950/30 p-2 rounded line-through text-muted-foreground">
                  {v.originalText}
                </p>
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Optimized</span>
                <p className="text-sm mt-1 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded font-medium">
                  {v.optimizedText}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Reason for Change</span>
                <p className="text-sm mt-1">{v.reasonForChange}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground">Expected Impact</span>
                <p className="text-sm mt-1 text-emerald-600">{v.expectedImprovement}</p>
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <Button size="sm" variant="outline" className="gap-2">
                <Save className="w-4 h-4" /> Save to Library
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
