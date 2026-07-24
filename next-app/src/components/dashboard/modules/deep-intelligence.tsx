"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelection } from "../selection-context";
import { workspaceEvents } from "../events";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Loader2, BrainCircuit, Activity, Users, Network, TrendingUp } from "lucide-react";
import { DeepContentIntelligenceResponse, Channel, SimilarChannelsResponse, OutlierDetectionResponse, IntelligenceReport, AIConsultantInsight } from "@/lib/types/discovery";

function ConsultantCard({ insight }: { insight: AIConsultantInsight }) {
  return (
    <Card className="bg-background/80 border-primary/20 shadow-md">
      <CardContent className="pt-4 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-bold text-sm text-primary">{insight.observation}</h4>
          <Badge variant="outline" className="bg-primary/10">{insight.confidenceScore}% Conf.</Badge>
        </div>
        <div className="text-xs space-y-2 text-muted-foreground">
          <p><strong className="text-foreground">Why it works:</strong> {insight.whyItWorks}</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-500/10 p-2 rounded border border-green-500/20 text-green-700 dark:text-green-400">
              <strong>When to use:</strong> {insight.whenItWorks}
            </div>
            <div className="bg-destructive/10 p-2 rounded border border-destructive/20 text-destructive">
              <strong>When to avoid:</strong> {insight.whenItFails}
            </div>
          </div>
          <p className="bg-muted p-2 rounded border border-border"><strong>Application:</strong> {insight.whoShouldUseIt} <br/><span className="text-primary font-medium">Impact: {insight.expectedImpact}</span></p>
          <p className="italic text-[10px] pt-1">Evidence: {insight.supportingEvidence}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DeepIntelligenceModule() {
  const { selectedChannelId } = useSelection();
  const queryClient = useQueryClient();

  // Try to grab pre-existing data from ALL previous modules to act as the massive context
  const targetChannel = queryClient.getQueryData<{data: Channel[]}>(["channel-search"])?.data?.find(c => c.id === selectedChannelId);
  const similarData = queryClient.getQueryData<SimilarChannelsResponse>(["similar-channels", selectedChannelId]);
  const outlierData = queryClient.getQueryData<OutlierDetectionResponse>(["outlier-detection", selectedChannelId]);
  const reportData = queryClient.getQueryData<IntelligenceReport>(["intelligence-report", selectedChannelId]);

  const hasDependencies = !!targetChannel && !!outlierData;

  const {
    data: intel,
    error,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["deep-intelligence", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId || !hasDependencies) return null;
      
      const res = await fetch("/api/discovery/deep-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: targetChannel,
          similarData,
          outlierData,
          reportData
        }),
      });
      if (!res.ok) throw new Error("Failed to generate Deep Intelligence");
      const generatedIntel = await res.json() as DeepContentIntelligenceResponse;
      
      // Save to intelligence memory
      // We will need to register DEEP_INTELLIGENCE_GENERATED in events.ts later
      workspaceEvents.emit("DEEP_INTELLIGENCE_GENERATED", { id: generatedIntel.id, channelId: selectedChannelId });
      
      return generatedIntel;
    },
    enabled: false, 
    staleTime: Infinity, 
  });

  if (!selectedChannelId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <Target className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Channel Selected</h2>
        <p className="text-muted-foreground max-w-md">Select a channel to decode its Content DNA and psychological profile.</p>
      </div>
    );
  }

  if (!hasDependencies && !intel && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <BrainCircuit className="w-16 h-16 text-primary/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Missing Foundational Data</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          Deep Content Intelligence requires baseline math and outliers to ground its psychological reasoning. Please run <b>Outlier Detection</b> first.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between bg-background/95 backdrop-blur sticky top-0 z-10 py-4 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Deep Content Intelligence
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h1>
          <p className="text-muted-foreground text-sm">
            Target ID: {selectedChannelId}
          </p>
        </div>
        <div>
          {!intel && (
            <Button onClick={() => refetch()} disabled={isLoading || !hasDependencies}>
              <BrainCircuit className="w-4 h-4 mr-2" />
              Decode DNA
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
          <h3 className="text-lg font-bold">Generation Failed</h3>
          <p>{(error as Error).message}</p>
        </div>
      )}

      {intel && !isLoading && (
        <div className="space-y-8 pb-10">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardHeader><CardTitle className="flex items-center gap-2 text-blue-500"><BrainCircuit className="w-5 h-5"/> Content DNA</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="font-semibold block">Storytelling Structure</span><p className="text-muted-foreground">{intel.contentDNA.storytellingStructure}</p></div>
                <div><span className="font-semibold block">Hook Architecture</span><p className="text-muted-foreground">{intel.contentDNA.hookArchitecture}</p></div>
                <div><span className="font-semibold block">Pacing & Emotion</span><p className="text-muted-foreground">{intel.contentDNA.narrativePacing} • {intel.contentDNA.emotionalProgression}</p></div>
                <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground/80 italic">Evidence: {intel.contentDNA.evidence}</div>
              </CardContent>
            </Card>

            <Card className="border-purple-500/30 bg-purple-500/5">
              <CardHeader><CardTitle className="flex items-center gap-2 text-purple-500"><Users className="w-5 h-5"/> Audience Psychology</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="font-semibold block">Target Demographic</span><p className="text-muted-foreground">{intel.audiencePsychology.beginnerVsAdvanced}</p></div>
                <div><span className="font-semibold block">Core Motivations</span><p className="text-muted-foreground">{intel.audiencePsychology.emotionalMotivations.join(", ")}</p></div>
                <div><span className="font-semibold block">Pain Points</span><p className="text-muted-foreground">{intel.audiencePsychology.painPoints.join(", ")}</p></div>
                <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground/80 italic">Evidence: {intel.audiencePsychology.evidence}</div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader><CardTitle className="flex items-center gap-2"><Network className="w-5 h-5"/> Reusable Knowledge Graph</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {intel.knowledgeGraph.map((node, i) => (
                  <div key={i} className="flex flex-col bg-background p-3 rounded border border-border shadow-sm text-sm">
                    <div className="flex items-center justify-between font-bold mb-2 text-primary">
                      <span>{node.from}</span>
                      <span className="text-xs px-2 py-0.5 bg-primary/20 rounded-full">{node.relationship}</span>
                      <span>{node.to}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{node.context}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5"/> Consultant Insights (Why it works)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {intel.consultantInsights.map((insight, i) => <ConsultantCard key={i} insight={insight} />)}
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
