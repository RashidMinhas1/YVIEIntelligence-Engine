"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSelection } from "../selection-context";
import { workspaceEvents } from "../events";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Target, Loader2, Download, FileText, FileJson, Zap, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react";
import { IntelligenceReport, Channel, SimilarChannelsResponse, OutlierDetectionResponse, PrioritizedOpportunity } from "@/lib/types/discovery";

function OpportunityCard({ opp }: { opp: PrioritizedOpportunity }) {
  const impactColor = opp.impact === "High" ? "bg-green-500/20 text-green-500" : opp.impact === "Medium" ? "bg-yellow-500/20 text-yellow-500" : "bg-muted text-muted-foreground";
  return (
    <Card className="bg-background/50 border-border/50">
      <CardContent className="pt-4 flex flex-col h-full justify-between">
        <div>
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-sm">{opp.title}</h4>
            <Badge variant="outline" className={impactColor}>{opp.impact} Impact</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-4">{opp.description}</p>
        </div>
        <div className="text-xs grid grid-cols-2 gap-2 mt-auto border-t border-border/50 pt-2">
          <div><span className="font-semibold">Diff:</span> {opp.difficulty}</div>
          <div><span className="font-semibold text-primary">Growth:</span> {opp.expectedGrowth}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function IntelligenceReportModule() {
  const { selectedChannelId } = useSelection();
  const queryClient = useQueryClient();

  // Optionally grab pre-existing data from previous modules to save backend processing, but not required
  const targetChannel = queryClient.getQueryData<{data: Channel[]}>(["channel-search"])?.data?.find(c => c.id === selectedChannelId);
  const similarData = queryClient.getQueryData<SimilarChannelsResponse>(["similar-channels", selectedChannelId]);
  const outlierData = queryClient.getQueryData<OutlierDetectionResponse>(["outlier-detection", selectedChannelId]);

  const {
    data: report,
    error,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["intelligence-report", selectedChannelId],
    queryFn: async () => {
      if (!selectedChannelId) return null;
      
      const res = await fetch("/api/discovery/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelId: selectedChannelId,
          channel: targetChannel,
          similarData,
          outlierData
        }),
      });
      if (!res.ok) throw new Error("Failed to generate intelligence report");
      const generatedReport = await res.json() as IntelligenceReport;
      
      // Save to intelligence memory
      workspaceEvents.emit("REPORT_GENERATED", { reportId: generatedReport.id, channelId: selectedChannelId });
      
      return generatedReport;
    },
    enabled: !!selectedChannelId,
    staleTime: 1000 * 60 * 60, // 1 hour memory cache
    retry: 1,
  });

  const exportAsJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Intelligence_Report_${report.channelId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsMarkdown = () => {
    if (!report) return;
    const md = `
# YouTube Intelligence Report
**Channel ID:** ${report.channelId}
**Version:** ${report.meta.version}
**Generated At:** ${new Date(report.meta.generatedAt).toLocaleString()}

## Executive Summary
- **Overall Health:** ${report.executiveSummary.overallHealth}
- **Growth Stage:** ${report.executiveSummary.growthStage}
- **Biggest Opportunities:** ${report.executiveSummary.biggestOpportunities.join(", ")}
- **Biggest Risks:** ${report.executiveSummary.biggestRisks.join(", ")}

## Competitor Landscape
${report.competitorLandscape.summary}
- **Direct:** ${report.competitorLandscape.directCompetitors.join(", ")}

## Viral Formula
- **Titles:** ${report.viralFormula.titles.join(" | ")}
- **Hooks:** ${report.viralFormula.hooks.join(" | ")}

## Growth Roadmap
### Quick Wins
${report.growthRoadmap.quickWins.map(w => `- **${w.title}**: ${w.description}`).join("\n")}
    `;
    const blob = new Blob([md.trim()], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Intelligence_Report_${report.channelId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!selectedChannelId) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <Target className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">No Channel Selected</h2>
        <p className="text-muted-foreground max-w-md">Select a channel to generate a master Intelligence Report.</p>
      </div>
    );
  }

  if (!report && !isLoading && error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Generating Report</h2>
        <p className="text-muted-foreground max-w-md mb-6">
          {(error as Error).message}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex items-center justify-between bg-background/95 backdrop-blur sticky top-0 z-10 py-4 border-b border-border/50">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Master Intelligence Report
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
          </h1>
          <p className="text-muted-foreground text-sm">
            Target ID: {selectedChannelId}
          </p>
        </div>
        <div className="flex gap-2">
          {!report && (
            <Button onClick={() => refetch()} disabled={isLoading}>
              <Zap className="w-4 h-4 mr-2" />
              Generate Synthesis
            </Button>
          )}
          {report && (
            <>
              <Button variant="outline" onClick={exportAsMarkdown}>
                <FileText className="w-4 h-4 mr-2" /> Export MD
              </Button>
              <Button variant="outline" onClick={exportAsJson}>
                <FileJson className="w-4 h-4 mr-2" /> Export JSON
              </Button>
            </>
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
          <AlertCircle className="w-12 h-12 mb-4" />
          <h3 className="text-lg font-bold">Generation Failed</h3>
          <p>{(error as Error).message}</p>
        </div>
      )}

      {report && !isLoading && (
        <div className="space-y-8 pb-10">
          
          <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardHeader>
              <CardTitle className="text-xl">Executive Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-sm text-muted-foreground mb-1">Overall Health</h4>
                <p className="text-lg font-medium">{report.executiveSummary.overallHealth}</p>
                <Badge variant="secondary" className="mt-2">{report.executiveSummary.growthStage}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm text-green-500 mb-2">Biggest Opportunities</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {report.executiveSummary.biggestOpportunities.map((o,i)=><li key={i}>{o}</li>)}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-destructive mb-2">Biggest Risks</h4>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    {report.executiveSummary.biggestRisks.map((r,i)=><li key={i}>{r}</li>)}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Viral Formula</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div><span className="font-semibold block text-primary">Titles</span>{report.viralFormula.titles.join(" • ")}</div>
                <div><span className="font-semibold block text-primary">Hooks</span>{report.viralFormula.hooks.join(" • ")}</div>
                <div><span className="font-semibold block text-primary">Emotions</span>{report.viralFormula.emotionalTriggers.join(" • ")}</div>
                <div><span className="font-semibold block text-primary">Timing</span>{report.viralFormula.uploadTiming}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader><CardTitle>Content Gap Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div><span className="font-semibold block text-yellow-500">Missed Opportunities</span>
                  <ul className="list-disc list-inside mt-1">{report.contentGapAnalysis.missedOpportunities.map((m,i)=><li key={i}>{m}</li>)}</ul>
                </div>
                <div><span className="font-semibold block text-green-500">Emerging Trends</span>
                  <ul className="list-disc list-inside mt-1">{report.contentGapAnalysis.emergingTrends.map((m,i)=><li key={i}>{m}</li>)}</ul>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle>Growth Roadmap (Prioritized)</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500"/> Quick Wins</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {report.growthRoadmap.quickWins.map((qw, i) => <OpportunityCard key={i} opp={qw} />)}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-3 flex items-center gap-2"><Target className="w-5 h-5 text-blue-500"/> 30-Day Strategy</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {report.growthRoadmap.thirtyDayImprovements.map((qw, i) => <OpportunityCard key={i} opp={qw} />)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {report.contradictionsDetected?.length > 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><ShieldAlert className="w-5 h-5"/> Contradictions Detected</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {report.contradictionsDetected.map((c, i) => (
                  <div key={i} className="bg-background p-4 rounded border border-border">
                    <h4 className="font-bold text-sm mb-2">{c.issue}</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mb-3">
                      <div className="p-2 bg-muted rounded border-l-2 border-primary">{c.moduleA.name}: {c.moduleA.claim}</div>
                      <div className="p-2 bg-muted rounded border-l-2 border-destructive">{c.moduleB.name}: {c.moduleB.claim}</div>
                    </div>
                    <div className="text-sm"><span className="font-semibold text-primary">Resolution: </span>{c.resolution}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500"/> Evidence-Based Recommendations</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {report.evidenceBasedRecommendations.map((rec, i) => (
                  <div key={i} className="border-b border-border/50 pb-4 last:border-0 last:pb-0">
                    <h4 className="font-bold text-sm mb-1">{rec.recommendation}</h4>
                    <p className="text-xs text-muted-foreground mb-2">Evidence: {rec.evidence}</p>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-[10px]">Source: {rec.sourceModule}</Badge>
                      <Badge variant="secondary" className="text-[10px]">Confidence: {rec.confidenceScore}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>
      )}
    </div>
  );
}
