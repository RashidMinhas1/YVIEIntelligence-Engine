"use client";

import { AiCoachInsight } from "@/lib/types/viral-intelligence";
import { Lightbulb, TrendingUp, AlertTriangle, Target } from "lucide-react";

interface AiCoachCardProps {
  coach: AiCoachInsight;
}

export function AiCoachCard({ coach }: AiCoachCardProps) {
  return (
    <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 space-y-4">
      <div className="flex items-center space-x-2 text-primary">
        <Lightbulb className="w-5 h-5" />
        <h4 className="font-semibold text-lg">AI Coach Insights</h4>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-500">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium text-sm">Why It Matters</span>
          </div>
          <p className="text-sm text-muted-foreground">{coach.whyItMatters}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-500">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium text-sm">Performance Impact</span>
          </div>
          <p className="text-sm text-muted-foreground">{coach.performanceImpact}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-500">
            <Target className="w-4 h-4" />
            <span className="font-medium text-sm">What To Change</span>
          </div>
          <p className="text-sm text-muted-foreground">{coach.whatToChange}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-500">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium text-sm">Expected Improvement</span>
          </div>
          <p className="text-sm text-muted-foreground">{coach.expectedImprovement}</p>
        </div>
      </div>
    </div>
  );
}
