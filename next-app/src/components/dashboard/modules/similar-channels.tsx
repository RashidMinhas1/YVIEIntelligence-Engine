"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSelection } from "../selection-context";
import { workspaceEvents } from "../events";
import { ChannelCard } from "../components/channel-card";
import { CompareMatrix } from "../components/compare-matrix";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Target, Loader2, GitCompare } from "lucide-react";
import { SimilarChannelsResponse, Channel, CompareMatrixResponse } from "@/lib/types/discovery";

export default function SimilarChannelsModule() {
  const { selectedChannelId } = useSelection();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isCompareMode, setIsCompareMode] = useState(false);

  const {
    data: similarData,
    error: similarError,
    isLoading: isSimilarLoading,
    refetch: refetchSimilar
  } = useQuery({
    queryKey: ["similar-channels", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return null;
      const res = await fetch("/api/discovery/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetChannelId: selectedChannelId, limit: 12 }),
      });
      if (!res.ok) throw new Error("Failed to analyze similar channels");
      return (await res.json()) as SimilarChannelsResponse;
    },
    enabled: !!selectedChannelId,
    staleTime: 1000 * 60 * 30, // 30 minutes memory cache
    retry: 1,
  });

  const handleSaveToSession = (id: string) => {
    workspaceEvents.emit("RESEARCH_ITEM_SAVED", { id, type: "channel" });
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) return prev.filter(c => c !== id);
      if (prev.length >= 5) {
        alert("Maximum 5 channels can be compared.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const channels = similarData?.similarChannels || [];
  const targetChannel = similarData?.targetChannel;
  const compareChannels = targetChannel ? [targetChannel, ...channels.filter(c => compareIds.includes(c.id))] : channels.filter(c => compareIds.includes(c.id));

  if (!selectedChannelId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <Target className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Target Channel Selected</h2>
        <p className="text-muted-foreground max-w-md">
          Select a channel from the Channel Discovery module to analyze its competitors, classify their threat level, and uncover growth opportunities.
        </p>
      </div>
    );
  }



  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between bg-background/95 backdrop-blur sticky top-0 z-10 py-4 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Intelligent Similar Channels
            {isSimilarLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h1>
          <p className="text-muted-foreground text-sm">
            Target ID: {selectedChannelId} {similarData && `• Evaluated ${similarData.meta.totalEvaluated} candidates`}
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant={isCompareMode ? "default" : "outline"}
            onClick={() => setIsCompareMode(!isCompareMode)}
          >
            <GitCompare className="w-4 h-4 mr-2" />
            Compare Mode {compareIds.length > 0 && `(${compareIds.length})`}
          </Button>
          <Button variant="secondary" onClick={() => refetchSimilar()} disabled={isSimilarLoading}>
            Retry / Refresh
          </Button>
        </div>
      </div>

      {isSimilarLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[250px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {similarError && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h3 className="text-lg font-bold">Analysis Failed</h3>
          <p className="text-muted-foreground max-w-md mb-4">{(similarError as Error).message}</p>
          <Button onClick={() => refetchSimilar()} disabled={isSimilarLoading} variant="outline">Retry Analysis</Button>
        </div>
      )}

      {isCompareMode && compareIds.length >= 2 && (
        <div className="mb-8">
          <CompareMatrix channels={compareChannels} />
        </div>
      )}

      {channels.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {channels.map((channel, i) => (
            <div key={`${channel.id}-${i}`} className="relative group">
              <ChannelCard 
                channel={channel}
                onSave={handleSaveToSession}
                onCompare={() => toggleCompare(channel.id)}
              />
              {/* Compare Mode Overlay Select */}
              {isCompareMode && (
                <div 
                  className={`absolute inset-0 border-4 rounded-xl cursor-pointer transition-colors ${compareIds.includes(channel.id) ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/50 bg-background/50"}`}
                  onClick={() => toggleCompare(channel.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
