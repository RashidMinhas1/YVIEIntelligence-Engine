"use client";

import React from "react";
import { AssemblyScoreDetails } from "@/lib/assembly/engine";
import { Progress } from "@/components/ui/progress";
import { Activity } from "lucide-react";

export function AssemblyScorePanel({
  score,
  explainWhy
}: {
  score: AssemblyScoreDetails;
  explainWhy: string;
}) {
  if (score.overallScore === 0) return null;

  return (
    <div className="space-y-4 border border-border bg-muted/5 p-4 rounded-lg">
      <div className="flex justify-between items-center border-b border-border pb-3">
        <h3 className="font-bold font-mono text-sm uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Assembly Score
        </h3>
        <div className="text-2xl font-black font-mono text-primary">
          {score.overallScore}<span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-2">
        <ScoreBar label="Compatibility" value={score.compatibilityScore} />
        <ScoreBar label="Retention" value={score.retentionScore} />
        <ScoreBar label="Emotional" value={score.emotionalScore} />
        <ScoreBar label="Narrative" value={score.narrativeScore} />
        <ScoreBar label="Confidence" value={score.confidenceScore} />
      </div>

      <div className="mt-4 pt-3 border-t border-border space-y-1">
        <h4 className="text-[10px] font-bold uppercase text-muted-foreground">Pre-Generation Analysis</h4>
        <p className="text-xs text-foreground/90 leading-relaxed">{explainWhy}</p>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  let colorClass = "bg-red-500";
  if (value >= 80) colorClass = "bg-green-500";
  else if (value >= 50) colorClass = "bg-yellow-500";

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-mono uppercase text-muted-foreground">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <Progress value={value} className="h-1.5" indicatorClassName={colorClass} />
    </div>
  );
}
