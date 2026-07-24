"use client";

import { useEffect, useState } from "react";
import { StrategicIntelligence } from "@/lib/types/discovery";
import { useWorkspaceEvent } from "../events";
import { Compass, AlertTriangle, Target, Lightbulb, Activity, ArrowRight } from "lucide-react";

export function StrategyEngineModule({ channelId }: { channelId?: string }) {
  const [strategies, setStrategies] = useState<StrategicIntelligence[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStrategies = async () => {
    setLoading(true);
    try {
      const url = channelId ? `/api/discovery/strategy/roadmaps?channelId=${channelId}` : "/api/discovery/strategy/roadmaps";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStrategies(data.strategies || []);
      }
    } catch (err) {
      console.error("Failed to fetch strategies", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, [channelId]);

  useWorkspaceEvent("STRATEGY_GENERATED", () => {
    fetchStrategies();
  });

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Calculating Enterprise Strategy...</div>;
  }

  if (strategies.length === 0) {
    return <div className="p-8 text-center text-slate-500">No AI Strategy generated yet. Run the Strategy Engine.</div>;
  }

  const activeStrategy = strategies[0]; // Most recent

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-white flex items-center gap-2">
           <Compass className="h-6 w-6 text-indigo-400" /> AI Strategy & Decision Engine
         </h2>
         <span className="bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded border border-indigo-500/30">
           Master Blueprint Active
         </span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Decision Matrix */}
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-400" /> High-ROI Recommendations
          </h3>
          <div className="space-y-3">
            {activeStrategy.recommendations.sort((a,b) => b.roiScore - a.roiScore).slice(0, 5).map(rec => (
              <div key={rec.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex gap-4 hover:border-slate-700 transition-colors">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                    ${rec.category === 'Do' ? 'bg-emerald-500/20 text-emerald-400' : 
                      rec.category === 'Stop' ? 'bg-red-500/20 text-red-400' : 
                      rec.category === 'Improve' ? 'bg-amber-500/20 text-amber-400' : 
                      'bg-indigo-500/20 text-indigo-400'}`}>
                    {rec.roiScore}
                  </div>
                  <div className="text-[10px] text-center mt-1 text-slate-500 font-medium uppercase">{rec.category}</div>
                </div>
                <div className="flex-grow">
                  <h4 className="text-sm font-semibold text-white">{rec.recommendation}</h4>
                  <p className="text-xs text-slate-400 mt-1 mb-2">{rec.reason}</p>
                  <div className="flex gap-2 text-[10px]">
                    <span className="bg-slate-800 px-2 py-1 rounded text-slate-300">Growth: +{rec.expectedGrowthImpact}%</span>
                    <span className="bg-slate-800 px-2 py-1 rounded text-slate-300">Difficulty: {rec.difficulty}/100</span>
                    <span className="bg-slate-800 px-2 py-1 rounded text-slate-300">{rec.timeRequired}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Risks & Opportunities */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-red-400" /> Risk Detection
            </h3>
            <div className="space-y-3">
              {activeStrategy.risks.map((risk, idx) => (
                <div key={idx} className="border-l-2 border-red-500/50 pl-3">
                  <div className="text-sm font-medium text-red-300">{risk.type}</div>
                  <div className="text-xs text-slate-400 mt-1">{risk.description}</div>
                  <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" /> {risk.mitigationStrategy}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-md font-semibold text-slate-200 flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-amber-400" /> Opportunities
            </h3>
            <div className="space-y-2">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Untapped Topics</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {activeStrategy.opportunities.untappedTopics.slice(0,3).map(t => (
                    <span key={t} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
              <div className="mt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase">Emerging Trends</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {activeStrategy.opportunities.emergingTrends.slice(0,3).map(t => (
                    <span key={t} className="text-[10px] bg-indigo-900/50 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Content Roadmap */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mt-6">
        <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-blue-400" /> Strategic Content Roadmap (Next 10)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {activeStrategy.roadmap.next10Videos.slice(0, 5).map((vid, idx) => (
            <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-lg relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-50"></div>
               <div className="text-[10px] text-slate-500 mb-1 flex justify-between">
                 <span>#{idx + 1} {vid.format}</span>
                 <span className={vid.category === 'Evergreen' ? 'text-emerald-400' : 'text-amber-400'}>{vid.category}</span>
               </div>
               <div className="text-sm font-semibold text-white leading-tight mb-2">{vid.title}</div>
               <div className="text-xs text-slate-400 line-clamp-2">{vid.reason}</div>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
}
