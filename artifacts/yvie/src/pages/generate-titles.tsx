import { useState } from "react";
import { useGenerateTitles, useGetTitleAnalyses, getGetTitleAnalysesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { OutputViewer } from "@/components/output-viewer";

export default function GenerateTitles() {
  const [analysis, setAnalysis] = useState("");
  const [niche, setNiche] = useState("");
  const [outputMode, setOutputMode] = useState<"docs" | "text">("docs");
  const [result, setResult] = useState<{ titles: string[]; explanation: string } | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const { data: historyData } = useGetTitleAnalyses({
    query: { queryKey: getGetTitleAnalysesQueryKey() },
  });

  const mutation = useGenerateTitles({
    mutation: {
      onSuccess: (data) => {
        setResult(data);
      },
    },
  });

  const handleGenerate = () => {
    if (!analysis.trim()) return;
    mutation.mutate({ data: { analysis, niche: niche || undefined, outputMode } });
  };

  const handleCopyTitle = (title: string, i: number) => {
    navigator.clipboard.writeText(title);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Title Generator</h2>
        <p className="text-muted-foreground text-sm mt-1 font-mono">Generate 5 viral titles from your analysis</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider font-mono text-muted-foreground">Input</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {historyData && historyData.analyses.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs font-mono text-muted-foreground uppercase">Load from history</Label>
              <select
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground"
                onChange={(e) => {
                  const found = historyData.analyses.find((a) => String(a.id) === e.target.value);
                  if (found) setAnalysis(found.analysis);
                }}
                defaultValue=""
              >
                <option value="" disabled>Select a previous analysis...</option>
                {historyData.analyses.map((a) => (
                  <option key={a.id} value={a.id}>
                    Analysis #{a.id} — {new Date(a.createdAt).toLocaleDateString()} ({a.titles.length} titles)
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs font-mono text-muted-foreground uppercase">Title Analysis (from Analyze Titles page)</Label>
            <Textarea
              placeholder="Paste your title analysis here..."
              value={analysis}
              onChange={(e) => setAnalysis(e.target.value)}
              rows={8}
              className="bg-background border-border font-mono text-sm resize-none"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-mono text-muted-foreground uppercase">Niche / Topic (optional)</Label>
            <Input
              placeholder="e.g. personal finance, self-improvement, tech"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="bg-background border-border font-mono text-sm max-w-sm"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setOutputMode("docs")}
                className={`px-3 py-1.5 text-xs font-mono transition-colors ${outputMode === "docs" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
              >
                Docs Mode
              </button>
              <button
                onClick={() => setOutputMode("text")}
                className={`px-3 py-1.5 text-xs font-mono transition-colors border-l border-border ${outputMode === "text" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
              >
                Plain Text
              </button>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={mutation.isPending || !analysis.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-sm"
            >
              {mutation.isPending ? "Generating..." : "Generate 5 Titles"}
            </Button>

            {result && (
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={mutation.isPending}
                className="font-mono text-sm"
              >
                Regenerate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {mutation.isPending && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
        </div>
      )}

      {result && !mutation.isPending && (
        <div className="space-y-6">
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider font-mono text-muted-foreground">Generated Titles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {result.titles.map((title, i) => (
                <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-black font-mono text-primary/50 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-sm text-foreground">{title}</span>
                  </div>
                  <button
                    onClick={() => handleCopyTitle(title, i)}
                    className="text-xs font-mono text-muted-foreground hover:text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copied === i ? "Copied!" : "Copy"}
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-sm uppercase tracking-wider font-mono text-muted-foreground">Full Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <OutputViewer
                content={result.explanation}
                outputMode={outputMode}
                onModeChange={setOutputMode}
                filename="generated-titles"
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
