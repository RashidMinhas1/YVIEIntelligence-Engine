"use client";

import { useGetDashboardStats } from "@/integrations/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

function StatCard({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="pt-6">
        {loading ? (
          <Skeleton className="h-8 w-16 mb-1" />
        ) : (
          <p className="text-3xl font-bold text-primary tabular-nums">{value}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-mono">{label}</p>
      </CardContent>
    </Card>
  );
}

const typeLabels: Record<string, string> = {
  script_generated: "Script Generated",
  title_analyzed: "Titles Analyzed",
};

export default function Dashboard() {
  const { data, isLoading } = useGetDashboardStats();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Intelligence Dashboard</h2>
        <p className="text-muted-foreground text-sm mt-1 font-mono">System overview — all operations nominal</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Videos Tracked" value={data?.totalVideos ?? 0} loading={isLoading} />
        <StatCard label="Competitors" value={data?.totalCompetitors ?? 0} loading={isLoading} />
        <StatCard label="Title Analyses" value={data?.totalTitleAnalyses ?? 0} loading={isLoading} />
        <StatCard label="Script Analyses" value={data?.totalScriptAnalyses ?? 0} loading={isLoading} />
        <StatCard label="Scripts Generated" value={data?.totalGeneratedScripts ?? 0} loading={isLoading} />
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm uppercase tracking-wider font-mono text-muted-foreground">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (data?.recentActivity ?? []).length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm font-mono">
              No activity yet. Start by fetching competitor videos.
            </div>
          ) : (
            <div className="space-y-2">
              {(data?.recentActivity ?? []).map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30">
                      {typeLabels[item.type] ?? item.type}
                    </Badge>
                    <span className="text-sm text-foreground truncate max-w-xs">{item.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono shrink-0">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { step: "01", title: "Fetch Competitors", desc: "Input 1–3 YouTube channels and pull their latest 10 videos each." },
          { step: "02", title: "Analyze & Generate Titles", desc: "Paste titles into the analyzer, then generate 5 viral alternatives." },
          { step: "03", title: "Script Intelligence", desc: "Analyze a competitor script and generate a full retention-optimized script." },
        ].map((item) => (
          <div key={item.step} className="rounded-lg border border-border bg-card p-5">
            <span className="text-4xl font-black text-primary/20 font-mono">{item.step}</span>
            <h3 className="text-sm font-semibold mt-2">{item.title}</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
