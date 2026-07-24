"use client";

import { useEffect, useState } from "react";
import { SynergyFramework } from "@/lib/types/discovery";
import { useWorkspaceEvent } from "../events";
import { Zap, Link as LinkIcon, RefreshCcw, Activity } from "lucide-react";

export function SynergyIntelligenceModule({ channelId }: { channelId?: string }) {
  const [synergies, setSynergies] = useState<SynergyFramework[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSynergies = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discovery/synergies");
      if (res.ok) {
        const data = await res.json();
        setSynergies(data.synergyFrameworks || []);
      }
    } catch (err) {
      console.error("Failed to fetch synergies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSynergies();
  }, [channelId]);

  useWorkspaceEvent("SYNERGY_INTELLIGENCE_GENERATED", () => {
    fetchSynergies();
  });

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading Click Packages...</div>;
  }

  if (synergies.length === 0) {
    return <div className="p-8 text-center text-slate-500">No Click Packages extracted yet. Run Synergy Analysis first.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-xl font-bold text-white flex items-center gap-2">
           <LinkIcon className="h-5 w-5 text-indigo-400" /> Click Package Database
         </h2>
         <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded border border-indigo-500/30">
           {synergies.length} Synergy Frameworks
         </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {synergies.map((framework) => (
          <div key={framework.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                 <h3 className="text-lg font-bold text-white flex items-center gap-2">
                   {framework.frameworkName}
                 </h3>
                 <p className="text-xs text-slate-400 mt-1">Title: {framework.titleFormula}</p>
                 <p className="text-xs text-slate-400">Thumb: {framework.thumbnailFormula}</p>
              </div>
              <div className="text-right">
                 <div className="text-sm font-semibold text-emerald-400 flex items-center gap-1">
                   <Activity className="h-4 w-4" /> {framework.ctrPrediction.synergyScore} Synergy
                 </div>
                 <div className="text-xs text-slate-500">CTR: {framework.ctrPrediction.combinedCtrPrediction}</div>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 mb-4">
              <h4 className="text-xs font-semibold text-slate-300 mb-2">Promise Lifecycle</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Title Promise:</span>
                  <span className="text-slate-300 truncate max-w-[200px]" title={framework.promiseLifecycle.titlePromise}>{framework.promiseLifecycle.titlePromise}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Thumb Promise:</span>
                  <span className="text-slate-300 truncate max-w-[200px]" title={framework.promiseLifecycle.thumbnailPromise}>{framework.promiseLifecycle.thumbnailPromise}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Alignment:</span>
                  <span className="text-blue-400">{framework.promiseLifecycle.alignmentScore}/100</span>
                </div>
                {framework.promiseLifecycle.issues.length > 0 && (
                   <div className="mt-2 text-xs text-red-400">
                     ⚠️ {framework.promiseLifecycle.issues.join(", ")}
                   </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-500 mb-1">Psychology</div>
                  <div className="text-sm text-indigo-300 font-medium">Alignment: {framework.psychologicalConsistency.overallAlignmentScore}</div>
               </div>
               <div className="bg-slate-950 p-3 rounded border border-slate-800">
                  <div className="text-[10px] uppercase text-slate-500 mb-1">Audience</div>
                  <div className="text-sm text-green-300 font-medium">Match: {framework.audienceConsistency.audienceMatchScore}</div>
               </div>
            </div>

            <div className="bg-indigo-500/10 p-3 rounded text-xs border border-indigo-500/20 text-indigo-300">
              <Zap className="h-3 w-3 inline mr-1" /> {framework.psychologicalFormula}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
