"use client";
import { memo } from "react";

import { useQuery } from "@tanstack/react-query";
import { useSelection } from "../selection-context";
import { workspaceEvents } from "../events";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Target, Loader2, TrendingUp, Zap, BarChart3, Clock, PlayCircle } from "lucide-react";
import { OutlierDetectionResponse, OutlierVideo, VideoBaseline } from "@/lib/types/discovery";
import Image from "next/image";

function formatNumber(num: number) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function BaselineDashboard({ baseline }: { baseline: VideoBaseline }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm font-medium">Median Views</span>
          </div>
          <div className="text-2xl font-bold">{formatNumber(baseline.medianViews)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Typical Range</span>
          </div>
          <div className="text-2xl font-bold">{formatNumber(baseline.typicalViewRange[0])} - {formatNumber(baseline.typicalViewRange[1])}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Mean Views</span>
          </div>
          <div className="text-2xl font-bold">{formatNumber(baseline.meanViews)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Std Deviation</span>
          </div>
          <div className="text-2xl font-bold">{formatNumber(baseline.standardDeviation)}</div>
        </CardContent>
      </Card>
    </div>
  );
}

const OutlierCard = memo(function OutlierCard({ video, onSave }: { video: OutlierVideo, onSave: (id: string) => void }) {
  return (
    <Card className="overflow-hidden border-primary/20 bg-primary/5 flex flex-col h-full">
      <div className="relative aspect-video">
        <Image src={video.thumbnailUrl} alt={video.title} fill className="object-cover" unoptimized />
        <div className="absolute top-2 right-2 flex gap-2">
          {video.performanceRatio && (
            <Badge variant="secondary" className="bg-background/80 backdrop-blur font-bold text-primary border border-primary/20">
              {video.performanceRatio.toFixed(1)}x Expected
            </Badge>
          )}
          <Badge variant="default" className="font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(var(--primary),0.5)]">
            <Zap className="w-3 h-3" />
            {video.outlierScore}
          </Badge>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-white text-xs font-bold flex items-center gap-1">
          <PlayCircle className="w-3 h-3" />
          {formatNumber(video.viewCount)}
        </div>
      </div>
      <CardContent className="pt-4 flex flex-col flex-1">
        <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2" title={video.title}>{video.title}</h3>
        
        {/* Core Enterprise Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-medium mt-auto">
          <div className="bg-background/50 p-2 rounded border border-border/50">
            <div className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Velocity</div>
            <div className="text-foreground">{formatNumber(video.viewVelocity || 0)} / day</div>
          </div>
          <div className="bg-background/50 p-2 rounded border border-border/50">
            <div className="text-muted-foreground flex items-center gap-1"><Target className="w-3 h-3"/> CTR Est.</div>
            <div className="text-foreground">{video.ctrEstimate ? video.ctrEstimate.toFixed(1) : "-"}%</div>
          </div>
          <div className="bg-background/50 p-2 rounded border border-border/50">
            <div className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3"/> Retention</div>
            <div className="text-foreground">{video.retentionEstimate ? video.retentionEstimate.toFixed(0) : "-"}%</div>
          </div>
          <div className="bg-background/50 p-2 rounded border border-border/50">
            <div className="text-muted-foreground flex items-center gap-1"><BarChart3 className="w-3 h-3"/> Engagement</div>
            <div className="text-foreground">{video.engagementEstimate ? video.engagementEstimate.toFixed(1) : "-"}%</div>
          </div>
        </div>

        {video.viralReasoning && (
          <div className="mt-2 space-y-3 bg-background/50 p-3 rounded-lg border border-border/50 text-sm">
            <div>
              <span className="font-bold text-primary block mb-1">Viral Reasoning</span>
              <p className="text-muted-foreground">{video.viralReasoning as string}</p>
            </div>
            {(video.evidence as string[])?.length > 0 && (
              <div>
                <span className="font-semibold text-xs text-muted-foreground">Evidence:</span>
                <ul className="list-disc pl-4 text-xs mt-1 text-muted-foreground">
                  {(video.evidence as string[]).map((ev, i) => <li key={i}>{ev}</li>)}
                </ul>
              </div>
            )}
            {video.repeatability && (
              <div>
                <span className="font-semibold text-xs text-muted-foreground">Repeatability:</span>
                <p className="text-xs text-muted-foreground">{video.repeatability as string}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onSave(video.id)}>
            Save to Session
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

export default function OutlierDetectionModule() {
  const { selectedChannelId } = useSelection();

  const {
    data: outlierData,
    error: outlierError,
    isLoading: isOutlierLoading,
    refetch: refetchOutliers
  } = useQuery({
    queryKey: ["outlier-detection", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return null;
      const res = await fetch("/api/discovery/outliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetChannelId: selectedChannelId }),
      });
      if (!res.ok) throw new Error("Failed to detect outliers");
      return (await res.json()) as OutlierDetectionResponse;
    },
    enabled: !!selectedChannelId,
    staleTime: 1000 * 60 * 30, // 30 minutes memory cache
    retry: 1,
  });

  const handleSaveToSession = (id: string) => {
    workspaceEvents.emit("RESEARCH_ITEM_SAVED", { id, type: "video" });
  };

  if (!selectedChannelId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <Target className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Target Channel Selected</h2>
        <p className="text-muted-foreground max-w-md">
          Select a channel from the Channel Discovery module to analyze its video baseline and decode its most viral outliers.
        </p>
      </div>
    );
  }

  const outliers = outlierData?.videos?.filter(v => v.isOutlier) || [];

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between bg-background/95 backdrop-blur sticky top-0 z-10 py-4 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Outlier Detection Engine
            {isOutlierLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h1>
          <p className="text-muted-foreground text-sm">
            Target ID: {selectedChannelId} {outlierData && `• Sampled ${outlierData.meta.sampledCount} videos`}
          </p>
        </div>
        <div>
          <Button variant="secondary" onClick={() => refetchOutliers()} disabled={isOutlierLoading}>
            Refresh Analysis
          </Button>
        </div>
      </div>

      {isOutlierLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      )}

      {outlierError && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h3 className="text-lg font-bold">Analysis Failed</h3>
          <p className="text-muted-foreground max-w-md mb-4">{(outlierError as Error).message}</p>
          <Button onClick={() => refetchOutliers()} disabled={isOutlierLoading} variant="outline">Retry Analysis</Button>
        </div>
      )}

      {outlierData && !isOutlierLoading && (
        <>
          <BaselineDashboard baseline={outlierData.baseline} />
          
          {outlierData.patternAnalysis && (
            <Card className="mb-8 border-primary/50 bg-gradient-to-br from-background to-primary/5 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Zap className="w-5 h-5 text-primary" />
                  AI Viral Pattern Analysis
                  <Badge variant="outline" className="ml-2 font-normal text-xs">
                    Confidence: {outlierData.patternAnalysis.confidenceScore}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-1">Title Format</h4>
                      <p className="text-sm">{outlierData.patternAnalysis.titleFormat}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-1">Thumbnail Concept</h4>
                      <p className="text-sm">{outlierData.patternAnalysis.thumbnailConcept}</p>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-1">Topic Angle</h4>
                      <p className="text-sm">{outlierData.patternAnalysis.topicAngle}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-1">Psychological Trigger</h4>
                      <p className="text-sm text-primary">{outlierData.patternAnalysis.psychologicalTrigger}</p>
                    </div>
                    <div className="bg-background/80 p-4 rounded-xl border border-primary/20">
                      <h4 className="font-bold text-primary mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4"/> Repeatable Formula
                      </h4>
                      <p className="text-sm">{outlierData.patternAnalysis.repeatableFormula}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <h3 className="text-xl font-bold mb-4">Statistically Significant Outliers</h3>
          {outliers.length === 0 ? (
            <p className="text-muted-foreground p-8 text-center bg-secondary/20 rounded-xl border border-border/50">
              No statistically significant outliers found in the sampled dataset.
            </p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {outliers.map((video) => (
                <OutlierCard key={video.id} video={video} onSave={handleSaveToSession} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
