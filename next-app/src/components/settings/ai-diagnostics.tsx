"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCcw, Activity, Key, Clock, ShieldAlert, BarChart, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AIDiagnostics({ onSelectModel }: { onSelectModel?: (provider: string, model: string) => void } = {}) {
  const [history, setHistory] = useState<any[]>([]);
  const [health, setHealth] = useState<any[]>([]);
  const [cacheMetrics, setCacheMetrics] = useState<any>(null);
  const [queueMetrics, setQueueMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/ai/history");
      const data = await res.json();
      if (data.success) {
        setHistory(data.history || []);
        setHealth(data.health || []);
        setCacheMetrics(data.cacheMetrics || null);
        setQueueMetrics(data.queueMetrics || null);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getHealthBadge = (h: any) => {
    if (h.state === "OPEN") return <Badge variant="destructive" className="text-[10px]">{h.quotaExhausted ? '🔴 Quota Exhausted' : '🔴 Offline/Cooldown'}</Badge>;
    if (h.state === "HALF_OPEN") return <Badge className="bg-amber-500/20 text-amber-500 text-[10px]">🟡 Probing (Half-Open)</Badge>;
    
    const avgResponseTimeMs = h.successCount > 0 ? h.totalResponseTimeMs / h.successCount : null;
    if (avgResponseTimeMs === null || avgResponseTimeMs === 0) return <Badge className="bg-muted text-muted-foreground text-[10px]">⚪ Untested</Badge>;
    
    const s = avgResponseTimeMs / 1000;
    if (s < 7) return <Badge className="bg-emerald-500/20 text-emerald-500 text-[10px]">🟢 Fast ({s.toFixed(1)}s)</Badge>;
    if (s <= 10) return <Badge className="bg-amber-500/20 text-amber-500 text-[10px]">🟡 Medium ({s.toFixed(1)}s)</Badge>;
    return <Badge className="bg-rose-500/20 text-rose-500 text-[10px]">🔴 Slow ({s.toFixed(1)}s)</Badge>;
  };

  return (
    <Card className="mt-8 border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-muted-foreground" />
          <CardTitle>AI Diagnostics & Request History</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={fetchHistory} disabled={loading}>
          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-8">
        {health.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b pb-2">
              <ShieldAlert className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Model & Provider Health</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {health.map((h, idx) => {
                const avgMs = h.successCount > 0 ? h.totalResponseTimeMs / h.successCount : null;
                const successRate = h.successCount + h.failureCount > 0 ? h.successCount / (h.successCount + h.failureCount) : 1;
                const isHealthy = h.unhealthyUntil < Date.now();
                
                return (
                  <div 
                    key={idx} 
                    className={`p-4 border rounded-lg ${h.state === 'OPEN' ? 'opacity-50 border-rose-500/30 bg-rose-500/5' : 'bg-card'} ${onSelectModel ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
                    onClick={() => onSelectModel?.(h.provider, h.model)}
                  >
                    <div className="flex items-center justify-between mb-2 gap-2 border-b pb-2">
                      <span className="text-sm font-semibold truncate capitalize" title={`${h.provider}:${h.model}`}>{h.provider}</span>
                      <div className="shrink-0">{getHealthBadge(h)}</div>
                    </div>
                    
                    <div className="space-y-2 mt-3 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Bot className="w-3 h-3"/> Model</span>
                        <span className="font-mono truncate max-w-[120px] text-foreground">{h.model}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Key className="w-3 h-3"/> API Key</span>
                        <span className="font-mono text-foreground">{h.apiKey ? `...${h.apiKey.slice(-4)}` : 'default'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><BarChart className="w-3 h-3"/> Success Rate</span>
                        <span className="text-foreground">{(successRate * 100).toFixed(0)}% ({h.successCount} / {h.successCount + h.failureCount})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Avg Latency</span>
                        <span className="text-foreground">{avgMs ? `${avgMs.toFixed(0)} ms` : 'N/A'}</span>
                      </div>
                      {history.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1"><Activity className="w-3 h-3"/> P95 Latency</span>
                          <span className="text-foreground text-amber-500">
                            {(() => {
                               const latencies = history.filter(x => x.provider === h.provider && x.model === h.model && x.success).map(x => x.requestDurationMs).sort((a,b)=>a-b);
                               if (latencies.length === 0) return 'N/A';
                               const p95 = latencies[Math.floor(latencies.length * 0.95)];
                               return `${p95} ms`;
                            })()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="text-rose-500/80">{h.timeoutCount} Timeouts</span>
                        <span className="text-rose-500/80">{h.rateLimitCount} Rate Limits</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cacheMetrics && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">Cache Metrics</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span>Items in Cache:</span> <span className="font-mono text-foreground">{cacheMetrics.size} / {cacheMetrics.capacity}</span>
                <span>Lookups:</span> <span className="font-mono text-foreground">{cacheMetrics.lookups}</span>
                <span>Hits:</span> <span className="font-mono text-foreground">{cacheMetrics.hits}</span>
                <span>Hit Rate:</span> <span className="font-mono text-foreground">{(cacheMetrics.hitRate * 100).toFixed(1)}%</span>
              </div>
            </div>
          )}

          {queueMetrics && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">Queue Constraints</h3>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <span>Queued Tasks:</span> <span className="font-mono text-foreground">{queueMetrics.queued}</span>
                <span>Active Total:</span> <span className="font-mono text-foreground">{queueMetrics.runningTotal} / {queueMetrics.maxConcurrent}</span>
                <span>Active Streams:</span> <span className="font-mono text-foreground">{queueMetrics.runningStream}</span>
                <span>Active Discrete:</span> <span className="font-mono text-foreground">{queueMetrics.runningDiscrete}</span>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold border-b pb-2">Recent Requests</h3>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requests made yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                  <tr>
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Provider & Fallback</th>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, idx) => (
                    <tr key={idx} className="border-b border-border hover:bg-muted/30 transition-colors last:border-0">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize font-medium">{entry.provider}</span>
                        {entry.fallbackChain && entry.fallbackChain.length > 0 && (
                          <div className="mt-1 flex flex-col gap-1">
                            {entry.fallbackChain.map((fallback: string, i: number) => (
                              <span key={i} className="text-[10px] text-amber-500/80 font-mono flex items-center before:content-['└─'] before:mr-1">
                                {fallback}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs max-w-[200px] truncate" title={entry.model}>
                        {entry.model}
                      </td>
                      <td className="px-4 py-3">{entry.requestDurationMs}ms</td>
                      <td className="px-4 py-3">
                        {entry.success ? (
                          <Badge className="bg-emerald-500/20 text-emerald-500 border-none font-normal">Success</Badge>
                        ) : (
                          <Badge variant="destructive" className="font-normal" title={entry.error || "Failed"}>Failed</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
