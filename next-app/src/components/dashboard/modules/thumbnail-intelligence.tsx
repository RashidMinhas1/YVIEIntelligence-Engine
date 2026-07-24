"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelection } from "../selection-context";
import { workspaceEvents } from "../events";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Network, Loader2, Image as ImageIcon, BrainCircuit, Activity, ShieldCheck, Zap, Palette, Type as TypeIcon, ScanFace, TrendingUp
} from "lucide-react";
import { 
  OutlierDetectionResponse, 
  ThumbnailFramework,
  Channel
} from "@/lib/types/discovery";

export default function ThumbnailIntelligenceModule() {
  const { selectedChannelId } = useSelection();
  const queryClient = useQueryClient();

  const targetChannel = queryClient.getQueryData<{data: Channel[]}>(["channel-search"])?.data?.find(c => c.id === selectedChannelId);
  const outlierData = queryClient.getQueryData<OutlierDetectionResponse>(["outlier-detection", selectedChannelId]);

  const hasDependencies = !!targetChannel && !!outlierData;

  const {
    data: framework,
    error,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["thumbnail-intelligence", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId || !hasDependencies) return null;
      
      const res = await fetch("/api/discovery/thumbnail-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: targetChannel,
          outlierData
        }),
      });
      if (!res.ok) throw new Error("Failed to extract Thumbnail Intelligence");
      const extracted = await res.json() as ThumbnailFramework;
      
      workspaceEvents.emit("THUMBNAIL_INTELLIGENCE_GENERATED", { id: extracted.id, channelId: selectedChannelId });
      
      return extracted;
    },
    enabled: false, 
    staleTime: Infinity, 
  });

  if (!selectedChannelId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <ImageIcon className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Channel Selected</h2>
        <p className="text-muted-foreground max-w-md">Select a channel to analyze thumbnail psychology.</p>
      </div>
    );
  }

  if (!hasDependencies && !framework && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <Network className="w-16 h-16 text-primary/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Missing Intelligence</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          The Thumbnail Intelligence engine requires Outlier Data to discover repeatable visual templates.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between bg-background/95 backdrop-blur sticky top-0 z-10 py-4 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Thumbnail Intelligence Engine
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h1>
          <p className="text-muted-foreground text-sm">
            Reverse-engineering thumbnail DNA and visual hooks.
          </p>
        </div>
        <div>
          {!framework && (
            <Button onClick={() => refetch()} disabled={isLoading || !hasDependencies}>
              <BrainCircuit className="w-4 h-4 mr-2" />
              Extract Thumbnail DNA
            </Button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-60 rounded-xl" /><Skeleton className="h-60 rounded-xl" />
            <Skeleton className="h-60 rounded-xl" /><Skeleton className="h-60 rounded-xl" />
          </div>
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
          
          <Card className="border-pink-500/30 bg-gradient-to-br from-pink-500/5 to-background shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2 text-pink-500 border-pink-500/30 bg-pink-500/10">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Saved to Knowledge Repository
                  </Badge>
                  <CardTitle className="text-2xl">{framework.frameworkName}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Tested on {framework.frequency} outliers</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-primary">{framework.ctrPrediction.expectedCTR}</div>
                  <div className="text-xs uppercase font-bold text-muted-foreground">Expected CTR</div>
                </div>
              </div>
              <div className="mt-6 p-4 bg-primary/10 border border-primary/20 rounded-lg text-center">
                <span className="text-xs font-bold uppercase text-primary block mb-1">Visual DNA Flow</span>
                <p className="text-xl font-mono">{framework.thumbnailDnaTemplate}</p>
              </div>
              <div className="flex gap-2 mt-4 flex-wrap">
                <Badge variant="secondary">Primary Emotion: {framework.psychology.primaryEmotion}</Badge>
                <Badge variant="outline" className="text-muted-foreground">Motivation: {framework.psychology.clickMotivation}</Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Visual Analytics */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Palette className="w-4 h-4 text-orange-500"/> Visuals</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="text-muted-foreground block text-xs">Contrast</span> {framework.visual.contrast}</div>
                <div><span className="text-muted-foreground block text-xs">Brightness</span> {framework.visual.brightness}</div>
                <div><span className="text-muted-foreground block text-xs">Background</span> {framework.visual.background}</div>
                <div><span className="text-muted-foreground block text-xs">Composition</span> {framework.visual.composition}</div>
                <div className="pt-2 border-t border-border/50">
                  <span className="text-muted-foreground block text-xs mb-1">Palette</span>
                  <div className="flex flex-wrap gap-1">
                    {framework.visual.colorPalette.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subject Analysis */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><ScanFace className="w-4 h-4 text-blue-500"/> Subjects</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div><span className="text-muted-foreground block text-xs">Faces Detected</span> {framework.subject.numberOfFaces}</div>
                <div><span className="text-muted-foreground block text-xs">Facial Emotion</span> {framework.subject.facialEmotion}</div>
                <div><span className="text-muted-foreground block text-xs">Body Language</span> {framework.subject.bodyLanguage}</div>
                <div><span className="text-muted-foreground block text-xs">Object Focus</span> {framework.subject.objectFocus}</div>
              </CardContent>
            </Card>

            {/* Typography */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><TypeIcon className="w-4 h-4 text-purple-500"/> Typography</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                {framework.typography.hasText ? (
                  <>
                    <div><span className="text-muted-foreground block text-xs">Style & Weight</span> {framework.typography.fontStyle} / {framework.typography.fontWeight}</div>
                    <div><span className="text-muted-foreground block text-xs">Placement</span> {framework.typography.placement}</div>
                    <div><span className="text-muted-foreground block text-xs">Word Count</span> {framework.typography.wordCount} words</div>
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-muted-foreground block text-xs mb-1">Hierarchy</span>
                      {framework.typography.textHierarchy}
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground py-4 text-center italic">No Text Used</div>
                )}
              </CardContent>
            </Card>

            {/* CTR Prediction */}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500"/> CTR Scorecard</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Scroll Stop Score</span> <span>{framework.ctrPrediction.scrollStopScore}/100</span></div>
                  <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${framework.ctrPrediction.scrollStopScore}%` }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Curiosity Score</span> <span>{framework.ctrPrediction.curiosityScore}/100</span></div>
                  <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${framework.ctrPrediction.curiosityScore}%` }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Emotion Score</span> <span>{framework.ctrPrediction.emotionScore}/100</span></div>
                  <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-pink-500 h-1.5 rounded-full" style={{ width: `${framework.ctrPrediction.emotionScore}%` }}></div></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Clarity Score</span> <span>{framework.ctrPrediction.clarityScore}/100</span></div>
                  <div className="w-full bg-muted rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${framework.ctrPrediction.clarityScore}%` }}></div></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-muted/30">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Zap className="w-4 h-4"/> Visual Hook</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-3">
                <div><span className="text-muted-foreground block text-xs">Primary Hook</span> {framework.hook.primaryHook}</div>
                <div><span className="text-muted-foreground block text-xs">Visual Story</span> {framework.hook.visualStory}</div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-1">Attention Path</span>
                  <div className="flex gap-2 items-center flex-wrap">
                    {framework.hook.viewerAttentionPath.map((path, i) => (
                      <span key={i} className="flex items-center">
                        <Badge variant="outline">{path}</Badge>
                        {i < framework.hook.viewerAttentionPath.length - 1 && <span className="mx-1 text-muted-foreground">→</span>}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4"/> Conditions</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-3">
                <div><span className="text-muted-foreground block text-xs">Why It Works</span> {framework.whyItWorks}</div>
                <div><span className="text-muted-foreground block text-xs">When It Fails</span> {framework.whenItFails}</div>
              </CardContent>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}
