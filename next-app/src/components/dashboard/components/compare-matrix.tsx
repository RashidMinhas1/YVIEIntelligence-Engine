import { Channel, ChannelComparison, CompareMatrixResponse } from "@/lib/types/discovery";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";

interface CompareMatrixProps {
  channels: Channel[];
}

export function CompareMatrix({ channels }: CompareMatrixProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["compare", channels.map(c => c.id)],
    queryFn: async () => {
      if (channels.length < 2) return null;
      const res = await fetch("/api/discovery/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels }),
      });
      if (!res.ok) throw new Error("Failed to generate compare matrix");
      return (await res.json()) as CompareMatrixResponse;
    },
    enabled: channels.length >= 2,
    staleTime: 1000 * 60 * 60,
  });

  if (channels.length < 2) {
    return <div className="text-center p-8 text-muted-foreground">Select at least 2 channels to compare.</div>;
  }

  if (isLoading) {
    return (
      <Card className="mt-4 border-border/50 bg-card/50">
        <CardContent className="p-8 space-y-4">
          <div className="text-center font-bold text-primary animate-pulse mb-4">Generating Deep AI Comparison...</div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return <div className="text-center p-8 text-destructive">Error generating comparison.</div>;
  }

  const comparisons = data.comparisons;
  const metrics = ["Subscribers", "Total Views", "Upload Pattern", "Growth Status", "Performance Ratio", "Outlier Score", "Title Psychology", "Thumbnail Psychology", "Audience", "Hooks", "Storytelling", "Editing", "Publishing Strategy", "Viral Formula", "Strengths", "Weaknesses", "Recommendations"];

  return (
    <Card className="mt-4 border-border/50 bg-card/50 flex-1 overflow-hidden flex flex-col">
      <CardContent className="p-0 overflow-x-auto overflow-y-auto flex-1">
        <Table>
          <TableHeader className="bg-secondary/30 sticky top-0 z-10">
            <TableRow>
              <TableHead className="w-[200px] border-r border-border/50 bg-background/95 backdrop-blur">Metric</TableHead>
              {comparisons.map(c => (
                <TableHead key={c.channel.id} className="min-w-[250px] border-r border-border/50 text-center">
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden">
                      <Image src={c.channel.thumbnailUrl} alt={c.channel.title} fill className="object-cover" unoptimized />
                    </div>
                    <div className="font-bold text-base truncate w-full text-foreground">{c.channel.title}</div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map(metric => (
              <TableRow key={metric}>
                <TableCell className="font-semibold text-muted-foreground border-r border-border/50 bg-secondary/10 sticky left-0 z-10">
                  {metric}
                </TableCell>
                {comparisons.map(c => {
                  let value: any = "";
                  if (metric === "Subscribers") value = c.channel.subscriberCount.toLocaleString();
                  else if (metric === "Total Views") value = c.channel.viewCount.toLocaleString();
                  else if (metric === "Upload Pattern") value = c.uploadPattern;
                  else if (metric === "Growth Status") value = c.channel.growthStatus || "Stable";
                  else if (metric === "Performance Ratio") value = c.channel.performanceRatio ? `${c.channel.performanceRatio}x` : "-";
                  else if (metric === "Outlier Score") value = c.channel.outlierScore ? `${c.channel.outlierScore}/100` : "-";
                  else if (metric === "Title Psychology") value = c.titlePsychology;
                  else if (metric === "Thumbnail Psychology") value = c.thumbnailPsychology;
                  else if (metric === "Audience") value = c.audienceDemographic;
                  else if (metric === "Hooks") value = c.hookStyle;
                  else if (metric === "Storytelling") value = c.storytelling;
                  else if (metric === "Editing") value = c.editingStyle;
                  else if (metric === "Publishing Strategy") value = c.publishingStrategy;
                  else if (metric === "Viral Formula") value = c.viralFormula;
                  else if (metric === "Strengths") value = <ul className="list-disc pl-4 space-y-1 text-xs text-green-400">{c.strengths.map((s:string, i:number)=><li key={i}>{s}</li>)}</ul>;
                  else if (metric === "Weaknesses") value = <ul className="list-disc pl-4 space-y-1 text-xs text-red-400">{c.weaknesses.map((s:string, i:number)=><li key={i}>{s}</li>)}</ul>;
                  else if (metric === "Recommendations") value = <ul className="list-disc pl-4 space-y-1 text-xs text-primary">{c.opportunities.map((s:string, i:number)=><li key={i}>{s}</li>)}</ul>;
                  
                  return (
                    <TableCell key={`${c.channel.id}-${metric}`} className="border-r border-border/50 align-top text-sm">
                      {value}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
