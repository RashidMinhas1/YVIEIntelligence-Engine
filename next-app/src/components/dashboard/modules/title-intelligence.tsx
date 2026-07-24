"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelection } from "../selection-context";
import { workspaceEvents } from "../events";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Network, Loader2, Type, BrainCircuit, Activity, ShieldCheck, Tag, Zap, Target, Eye 
} from "lucide-react";
import { 
  DeepContentIntelligenceResponse, 
  OutlierDetectionResponse, 
  TitleFramework,
  Channel
} from "@/lib/types/discovery";

export default function TitleIntelligenceModule() {
  const { selectedChannelId } = useSelection();
  const queryClient = useQueryClient();

  // Depend on previous phases
  const targetChannel = queryClient.getQueryData<{data: Channel[]}>(["channel-search"])?.data?.find(c => c.id === selectedChannelId);
  const deepIntel = queryClient.getQueryData<DeepContentIntelligenceResponse>(["deep-intelligence", selectedChannelId]);
  const outlierData = queryClient.getQueryData<OutlierDetectionResponse>(["outlier-detection", selectedChannelId]);

  const hasDependencies = !!targetChannel && !!outlierData;

  const {
    data: framework,
    error,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["title-intelligence", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId || !hasDependencies) return null;
      
      const res = await fetch("/api/discovery/title-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: targetChannel,
          deepIntel,
          outlierData
        }),
      });
      if (!res.ok) throw new Error("Failed to extract Title Intelligence");
      const extracted = await res.json() as TitleFramework;
      
      workspaceEvents.emit("TITLE_INTELLIGENCE_GENERATED", { id: extracted.id, channelId: selectedChannelId });
      
      return extracted;
    },
    enabled: false, 
    staleTime: Infinity, 
  });

  if (!selectedChannelId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <Type className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Channel Selected</h2>
        <p className="text-muted-foreground max-w-md">Select a channel to analyze outlier title frameworks.</p>
      </div>
    );
  }

  if (!hasDependencies && !framework && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <Network className="w-16 h-16 text-primary/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Missing Intelligence</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          The Title Intelligence engine requires Outlier Data to discover repeatable title templates.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between bg-background/95 backdrop-blur sticky top-0 z-10 py-4 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Title Intelligence Engine
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h1>
          <p className="text-muted-foreground text-sm">
            Reverse-engineering thumbnail and title psychology.
          </p>
        </div>
        <div>
          {!framework && (
            <Button onClick={() => refetch()} disabled={isLoading || !hasDependencies}>
              <BrainCircuit className="w-4 h-4 mr-2" />
              Extract Title Framework
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

      {framework && !isLoading && (
        <div className="space-y-8 pb-10">
          
          {/* Framework Header Card */}
          <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-background shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2 text-blue-500 border-blue-500/30 bg-blue-500/10">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Saved to Knowledge Repository
                  </Badge>
                  <CardTitle className="text-2xl">{framework.frameworkName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Example: "{framework.exampleUsed}"</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-primary">{framework.successRate}%</div>
                  <div className="text-xs uppercase font-bold text-muted-foreground">Success Rate</div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                <span className="text-xs font-bold uppercase text-primary block mb-1">Reusable Template</span>
                <p className="text-xl font-mono">{framework.template}</p>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Badge variant="secondary">Intent: {framework.primaryIntent}</Badge>
                <Badge variant="outline" className="text-muted-foreground">Sub-Intent: {framework.secondaryIntent}</Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Promise Analysis */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Target className="w-4 h-4 text-purple-500"/> Promise Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="text-muted-foreground block text-xs">Explicit Promise</span> {framework.promise.explicitPromise}</div>
                <div><span className="text-muted-foreground block text-xs">Hidden Promise</span> {framework.promise.hiddenPromise}</div>
                <div><span className="text-muted-foreground block text-xs">Viewer Expectation</span> {framework.promise.viewerExpectation}</div>
                <div className="pt-2 border-t border-border/50">
                  <span className="text-muted-foreground block text-xs mb-1">Script Alignment</span>
                  <Badge variant={framework.promise.scriptAlignment === 'High' ? 'default' : 'secondary'}>{framework.promise.scriptAlignment}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Curiosity Gap */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500"/> Curiosity Gap</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Curiosity Strength</span> <span>{framework.curiosity.curiosityStrength}/100</span></div>
                  <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${framework.curiosity.curiosityStrength}%` }}></div></div>
                </div>
                <div><span className="text-muted-foreground block text-xs">Opening</span> {framework.curiosity.curiosityOpening}</div>
                <div><span className="text-muted-foreground block text-xs">Information Gap</span> {framework.curiosity.informationGap}</div>
                <div><span className="text-muted-foreground block text-xs">Click Motivation</span> {framework.curiosity.clickMotivation}</div>
              </CardContent>
            </Card>

            {/* Emotional Analysis & CTR */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Eye className="w-4 h-4 text-green-500"/> CTR Prediction</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-2 bg-muted rounded border border-border">
                  <span className="font-semibold">Expected CTR</span>
                  <span className="text-lg font-bold text-green-500">{framework.ctrPrediction.expectedCTR}</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Scroll Stop Score</span> <span>{framework.ctrPrediction.scrollStopScore}/100</span></div>
                  <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${framework.ctrPrediction.scrollStopScore}%` }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>First Impression</span> <span>{framework.ctrPrediction.firstImpressionScore}/100</span></div>
                  <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${framework.ctrPrediction.firstImpressionScore}%` }}></div></div>
                </div>
                <div className="pt-2 border-t border-border/50">
                  <span className="text-muted-foreground block text-xs mb-2">Detected Emotions</span>
                  <div className="flex gap-1 flex-wrap">
                    {framework.emotion.detectedEmotions.map(e => <Badge key={e} variant="outline" className="text-xs py-0 h-5">{e}</Badge>)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-muted/50 border-muted">
            <CardHeader><CardTitle className="text-sm">Audience & Proof</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline"><Tag className="w-3 h-3 mr-1"/> {framework.audience.experienceLevel}</Badge>
                <Badge variant="outline"><Tag className="w-3 h-3 mr-1"/> {framework.audience.ageGroup}</Badge>
                <Badge variant="secondary">Tested on {framework.frequency} videos</Badge>
              </div>
              <ul className="text-xs space-y-1 text-muted-foreground list-disc list-inside mt-2">
                {framework.sourceVideos.map((vid, i) => <li key={i}>{vid}</li>)}
              </ul>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
