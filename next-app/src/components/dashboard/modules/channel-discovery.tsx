"use client";

import { useState, useEffect } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ChannelDiscoveryFilters, ChannelDiscoveryResponse } from "@/lib/types/discovery";
import { ChannelSearchBar } from "../components/channel-search-bar";
import { ChannelFilters } from "../components/channel-filters";
import { ChannelCard } from "../components/channel-card";
import { useSelection } from "../selection-context";
import { workspaceEvents } from "../events";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, SearchX, Loader2, GitCompare, X } from "lucide-react";
import { CompareMatrix } from "../components/compare-matrix";

export default function ChannelDiscoveryModule() {
  const [filters, setFilters] = useState<ChannelDiscoveryFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [query, setQuery] = useState("");
  const { setSelectedChannelId } = useSelection();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  const fetchChannels = async ({ pageParam = "", signal }: { pageParam?: string, signal?: AbortSignal }) => {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    if (pageParam) params.set("pageToken", pageParam);
    if (filters.minSubscribers) params.set("minSubscribers", filters.minSubscribers.toString());
    if (filters.minViews) params.set("minViews", filters.minViews.toString());
    if (filters.country) params.set("country", filters.country);
    
    // Fallback to mock easily for testing UI, if needed we can set forceMock
    // params.set("forceMock", "true");

    const res = await fetch(`/api/discovery/channels?${params.toString()}`, { signal });
    if (!res.ok) throw new Error("Failed to fetch channels");
    return (await res.json()) as ChannelDiscoveryResponse;
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    status,
    refetch
  } = useInfiniteQuery({
    queryKey: ["channel-discovery", query, filters],
    queryFn: fetchChannels,
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage.meta.nextPageToken,
    enabled: !!query, // Only fetch automatically if there is a query, or manually triggered
    staleTime: 5 * 60 * 1000, // 5 minute cache deduplication
  });

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
  };

  const handlePin = (id: string) => {
    // Add to pinned array or session
  };

  const handleCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds(prev => prev.filter(c => c !== id));
    } else if (compareIds.length < 5) {
      setCompareIds(prev => [...prev, id]);
    } else {
      alert("You can only compare up to 5 channels at a time.");
    }
  };

  const handleOpenReport = (id: string) => {
    setSelectedChannelId(id);
    workspaceEvents.emit("navigate", "reports");
  };

  const channels = data?.pages.flatMap(page => page.data) || [];

  if (isComparing) {
    const compareChannels = channels.filter(c => compareIds.includes(c.id));
    return (
      <div className="flex flex-col h-full animate-in fade-in duration-300">
        <div className="flex items-center justify-between mb-6 bg-secondary/30 p-4 rounded-xl border border-border/50">
          <div>
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
              Enterprise Channel Comparison
            </h2>
            <p className="text-muted-foreground mt-1">Comparing {compareChannels.length} selected channels.</p>
          </div>
          <Button variant="outline" onClick={() => setIsComparing(false)}>
            <X className="w-4 h-4 mr-2" /> Back to Discovery
          </Button>
        </div>
        <CompareMatrix channels={compareChannels} />
      </div>
    );
  }
  const source = data?.pages[0]?.meta.source;
  const errorReason = data?.pages[0]?.meta.errorReason;

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col items-center sticky top-0 bg-background/95 backdrop-blur z-10 pb-4 pt-2">
        <div className="w-full max-w-3xl text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Channel Discovery</h1>
          <p className="text-muted-foreground">Find and analyze top-performing YouTube channels in your niche.</p>
        </div>
        
        <ChannelSearchBar 
          onSearch={handleSearch} 
          isLoading={isFetching && !isFetchingNextPage}
          onToggleFilters={() => setShowFilters(!showFilters)}
        />
        
        <ChannelFilters 
          filters={filters} 
          onChange={setFilters} 
          isVisible={showFilters} 
        />

        {source && (
          <div className="mt-4 text-xs font-mono text-muted-foreground flex items-center gap-2">
            Data Source: <span className={`px-2 py-0.5 rounded ${source === "mock" ? "bg-orange-500/20 text-orange-500" : "bg-green-500/20 text-green-500"}`}>{source.toUpperCase()}</span>
            {errorReason && <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded ml-2">Blocker: {errorReason}</span>}
          </div>
        )}
      </div>

      <div className="flex-1">
        {status === "pending" && isFetching && !isFetchingNextPage && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        {status === "error" && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <h3 className="text-lg font-bold">Failed to load channels</h3>
            <p className="text-muted-foreground max-w-md mb-4">{error.message}</p>
            <Button onClick={() => refetch()} disabled={isFetching} variant="outline">Try Again</Button>
          </div>
        )}

        {status === "success" && channels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchX className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-bold">No channels found</h3>
            <p className="text-muted-foreground max-w-md">Try adjusting your search terms or filters.</p>
          </div>
        )}

        {channels.length > 0 && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {channels.map((channel, i) => (
                <ChannelCard 
                  key={`${channel.id}-${i}`} // Handle potential duplicate mocks
                  channel={channel}
                  onCompare={handleCompare}
                  onPin={handlePin}
                  onOpenReport={handleOpenReport} 
                />
              ))}
            </div>
            
            {hasNextPage && (
              <div className="flex justify-center mt-10">
                <Button 
                  variant="outline" 
                  size="lg" 
                  onClick={() => fetchNextPage()} 
                  disabled={isFetchingNextPage}
                  className="min-w-[200px]"
                >
                  {isFetchingNextPage ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading...</>
                  ) : (
                    "Load More Channels"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Compare Bar */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 right-6 left-6 md:left-[280px] bg-background/95 backdrop-blur-md border border-primary/30 p-4 rounded-xl shadow-2xl flex items-center justify-between z-50 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 text-primary p-3 rounded-lg font-bold">
              {compareIds.length} / 5
            </div>
            <div>
              <p className="font-bold">Channels Selected for Comparison</p>
              <p className="text-xs text-muted-foreground">Select up to 5 channels to run a deep comparative analysis.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setCompareIds([])}>Clear</Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-[0_0_15px_rgba(var(--primary),0.5)]"
              disabled={compareIds.length < 2}
              onClick={() => setIsComparing(true)}
            >
              <GitCompare className="w-4 h-4 mr-2" /> 
              Compare {compareIds.length} Channels
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
