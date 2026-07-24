"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelection } from "../selection-context";
import { workspaceEvents } from "../events";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Network, Loader2, Beaker, Zap, Play, ChevronRight, Activity, Tag, ShieldCheck } from "lucide-react";
import { 
  DeepContentIntelligenceResponse, 
  OutlierDetectionResponse, 
  ViralFormula,
  Channel
} from "@/lib/types/discovery";

function StepCard({ title, content, isLast = false }: { title: string; content: string; isLast?: boolean }) {
  return (
    <div className="flex flex-col items-center flex-1 min-w-[120px]">
      <div className="w-full bg-background p-3 rounded-lg border border-border shadow-sm text-center relative z-10 h-full flex flex-col justify-center">
        <span className="text-[10px] font-bold uppercase text-primary mb-1 block">{title}</span>
        <p className="text-xs text-muted-foreground">{content}</p>
      </div>
      {!isLast && <ChevronRight className="w-4 h-4 text-muted-foreground/50 my-2 lg:hidden" />}
    </div>
  );
}

export default function ViralFormulaModule() {
  const { selectedChannelId } = useSelection();
  const queryClient = useQueryClient();

  // Depend on previous phases
  const targetChannel = queryClient.getQueryData<{data: Channel[]}>(["channel-search"])?.data?.find(c => c.id === selectedChannelId);
  const deepIntel = queryClient.getQueryData<DeepContentIntelligenceResponse>(["deep-intelligence", selectedChannelId]);
  const outlierData = queryClient.getQueryData<OutlierDetectionResponse>(["outlier-detection", selectedChannelId]);

  const hasDependencies = !!targetChannel && !!deepIntel && !!outlierData;

  const {
    data: formula,
    error,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["viral-formula-extraction", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId || !hasDependencies) return null;
      
      const res = await fetch("/api/discovery/viral-formula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: targetChannel,
          deepIntel,
          outlierData
        }),
      });
      if (!res.ok) throw new Error("Failed to extract Viral Formula");
      const extracted = await res.json() as ViralFormula;
      
      workspaceEvents.emit("FORMULA_EXTRACTED", { id: extracted.id, category: extracted.category });
      
      return extracted;
    },
    enabled: false, 
    staleTime: Infinity, 
  });

  if (!selectedChannelId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <Beaker className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Channel Selected</h2>
        <p className="text-muted-foreground max-w-md">Select a channel to extract a repeatable Viral Formula.</p>
      </div>
    );
  }

  if (!hasDependencies && !formula && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <Network className="w-16 h-16 text-primary/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Missing Intelligence</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          The Viral Formula engine requires Deep Content Intelligence and Outlier Data to discover repeatable success patterns.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between bg-background/95 backdrop-blur sticky top-0 z-10 py-4 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Viral Formula Engine
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h1>
          <p className="text-muted-foreground text-sm">
            Extracting repeatable systems, not just metrics.
          </p>
        </div>
        <div>
          {!formula && (
            <Button onClick={() => refetch()} disabled={isLoading || !hasDependencies}>
              <Beaker className="w-4 h-4 mr-2" />
              Extract Formula
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4"><Skeleton className="h-60 rounded-xl" /><Skeleton className="h-60 rounded-xl" /></div>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-10 text-center text-destructive">
          <Activity className="w-12 h-12 mb-4" />
          <h3 className="text-lg font-bold">Extraction Failed</h3>
          <p>{(error as Error).message}</p>
        </div>
      )}

      {formula && !isLoading && (
        <div className="space-y-8 pb-10">
          
          <Card className="border-green-500/30 bg-gradient-to-br from-green-500/5 to-background shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2 text-green-500 border-green-500/30 bg-green-500/10">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Saved to Knowledge Repository
                  </Badge>
                  <CardTitle className="text-2xl">{formula.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{formula.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-primary">{formula.successRate}%</div>
                  <div className="text-xs uppercase font-bold text-muted-foreground">Success Rate</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Badge variant="secondary">{formula.category}</Badge>
                {formula.tags.map(t => <Badge key={t} variant="outline" className="text-muted-foreground"><Tag className="w-3 h-3 mr-1"/>{t}</Badge>)}
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500"/> Structural Flow</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row items-stretch gap-2 lg:gap-4 relative">
                {/* Visual connecting line for desktop */}
                <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-border/50 -translate-y-1/2 z-0" />
                
                <StepCard title="Topic" content={formula.structure.topic} />
                <StepCard title="Hook" content={formula.structure.hook} />
                <StepCard title="Curiosity" content={formula.structure.curiosityPattern} />
                <StepCard title="Story" content={formula.structure.storyStructure} />
                <StepCard title="Retention" content={formula.structure.retentionTechnique} />
                <StepCard title="Emotion" content={formula.structure.emotionalTrigger} />
                <StepCard title="CTA" content={formula.structure.cta} isLast />
              </div>
              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                <span className="text-xs font-bold uppercase text-primary block mb-1">Expected Viewer Outcome</span>
                <p className="text-sm">{formula.structure.viewerOutcome}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Formula Strength</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Reliability", val: formula.strength.reliability, color: "bg-blue-500" },
                    { label: "Repeatability", val: formula.strength.repeatability, color: "bg-green-500" },
                    { label: "Expected Growth", val: formula.strength.expectedGrowth, color: "bg-purple-500" },
                    { label: "Difficulty", val: formula.strength.difficulty, color: "bg-orange-500" },
                    { label: "Risk", val: formula.strength.risk, color: "bg-destructive" },
                  ].map(stat => (
                    <div key={stat.label}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>{stat.label}</span>
                        <span>{stat.val}/100</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={`h-2 rounded-full ${stat.color}`} style={{ width: `${stat.val}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Success Conditions</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div><strong className="text-green-500">Why it succeeds:</strong> <span className="text-muted-foreground">{formula.conditions.whyItSucceeds}</span></div>
                <div><strong className="text-blue-500">When to use it:</strong> <span className="text-muted-foreground">{formula.conditions.whenItSucceeds}</span></div>
                <div><strong className="text-destructive">When it fails:</strong> <span className="text-muted-foreground">{formula.conditions.whenItFails}</span></div>
                <div className="pt-2 border-t border-border/50">
                  <strong className="block mb-1">Execution Quality Required:</strong>
                  <span className="text-muted-foreground">{formula.conditions.executionQuality}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted/50 border-muted">
            <CardHeader><CardTitle className="text-sm">Evidence References</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline">Detected {formula.frequency} times</Badge>
                <Badge variant="outline">{formula.evidenceCount} verified outlier proofs</Badge>
              </div>
              <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside">
                {formula.sourceVideos.map((vid, i) => <li key={i}>{vid}</li>)}
              </ul>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
