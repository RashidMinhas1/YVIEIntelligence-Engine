import { useState } from "react";
import { useFetchCompetitorVideos, useGetVideos, getGetVideosQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

export default function Competitors() {
  const [competitors, setCompetitors] = useState(["", "", ""]);
  const [youtubeApiKey, setYoutubeApiKey] = useState("");
  const [usedMock, setUsedMock] = useState(false);
  const queryClient = useQueryClient();

  const { data: videosData, isLoading: videosLoading } = useGetVideos(undefined, {
    query: { queryKey: getGetVideosQueryKey() },
  });

  const fetchMutation = useFetchCompetitorVideos({
    mutation: {
      onSuccess: (data) => {
        setUsedMock(data.usedMockData);
        queryClient.invalidateQueries({ queryKey: getGetVideosQueryKey() });
      },
    },
  });

  const handleFetch = () => {
    const active = competitors.filter((c) => c.trim());
    if (!active.length) return;
    fetchMutation.mutate({
      data: { competitors: active, youtubeApiKey: youtubeApiKey || undefined },
    });
  };

  const groupedByCompetitor: Record<string, typeof videosData.videos> = {};
  if (videosData?.videos) {
    for (const v of videosData.videos) {
      if (!groupedByCompetitor[v.competitor]) groupedByCompetitor[v.competitor] = [];
      groupedByCompetitor[v.competitor].push(v);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Competitor Intelligence</h2>
        <p className="text-muted-foreground text-sm mt-1 font-mono">Fetch and analyze competitor video data</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider font-mono text-muted-foreground">Target Channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-1">
                <Label className="text-xs font-mono text-muted-foreground uppercase">Competitor {i + 1}</Label>
                <Input
                  placeholder={i === 0 ? "e.g. MrBeast" : "Optional"}
                  value={competitors[i]}
                  onChange={(e) => {
                    const next = [...competitors];
                    next[i] = e.target.value;
                    setCompetitors(next);
                  }}
                  className="bg-background border-border font-mono text-sm"
                />
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-mono text-muted-foreground uppercase">YouTube API Key (optional)</Label>
            <Input
              type="password"
              placeholder="Leave empty to use demo data"
              value={youtubeApiKey}
              onChange={(e) => setYoutubeApiKey(e.target.value)}
              className="bg-background border-border font-mono text-sm max-w-sm"
            />
            <p className="text-xs text-muted-foreground font-mono">Without a key, realistic demo data is used.</p>
          </div>

          <Button
            onClick={handleFetch}
            disabled={fetchMutation.isPending || !competitors.some((c) => c.trim())}
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-sm"
          >
            {fetchMutation.isPending ? "Fetching..." : "Fetch Videos"}
          </Button>

          {usedMock && (
            <div className="text-xs text-yellow-500 font-mono bg-yellow-500/10 border border-yellow-500/20 rounded px-3 py-2">
              Using demo data — add a YouTube API key for real channel data.
            </div>
          )}
          {fetchMutation.isError && (
            <div className="text-xs text-destructive font-mono bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
              Error fetching videos. Please try again.
            </div>
          )}
        </CardContent>
      </Card>

      {videosLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : Object.keys(groupedByCompetitor).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(groupedByCompetitor).map(([comp, videos]) => (
            <Card key={comp} className="border-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2">
                  <span className="font-mono text-primary text-sm uppercase">{comp}</span>
                  <Badge variant="outline" className="text-xs font-mono">{videos.length} videos</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 pr-4 text-xs font-mono text-muted-foreground uppercase">#</th>
                        <th className="text-left py-2 pr-4 text-xs font-mono text-muted-foreground uppercase">Title</th>
                        <th className="text-left py-2 pr-4 text-xs font-mono text-muted-foreground uppercase">Views</th>
                        <th className="text-left py-2 text-xs font-mono text-muted-foreground uppercase">Link</th>
                      </tr>
                    </thead>
                    <tbody>
                      {videos.map((v, i) => (
                        <tr key={v.id} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 pr-4 text-muted-foreground font-mono text-xs">{String(i + 1).padStart(2, "0")}</td>
                          <td className="py-2.5 pr-4 text-foreground max-w-sm">{v.title}</td>
                          <td className="py-2.5 pr-4 text-primary font-mono font-bold">{v.views}</td>
                          <td className="py-2.5">
                            <a href={v.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-primary font-mono underline underline-offset-2">
                              Watch
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground text-sm font-mono">
          No videos fetched yet. Enter competitor channels above.
        </div>
      )}
    </div>
  );
}
