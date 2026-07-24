import { useState } from "react";
import { useAnalyzeTitles } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetTitleAnalysesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { OutputViewer } from "@/components/output-viewer";

export default function AnalyzeTitles() {
  const [titlesText, setTitlesText] = useState("");
  const [outputMode, setOutputMode] = useState<"docs" | "text">("docs");
  const [result, setResult] = useState<{ analysis: string; id: number } | null>(null);
  const queryClient = useQueryClient();

  const mutation = useAnalyzeTitles({
    mutation: {
      onSuccess: (data) => {
        setResult({ analysis: data.analysis, id: data.id });
        queryClient.invalidateQueries({ queryKey: getGetTitleAnalysesQueryKey() });
      },
    },
  });

  const parsedTitles = titlesText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const handleAnalyze = () => {
    if (!parsedTitles.length) return;
    mutation.mutate({ data: { titles: parsedTitles, outputMode } });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Title Analyzer</h2>
        <p className="text-muted-foreground text-sm mt-1 font-mono">Paste competitor titles to extract the winning formula</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider font-mono text-muted-foreground">Input Titles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-mono text-muted-foreground uppercase">
              Paste titles (one per line — up to 21)
              {parsedTitles.length > 0 && (
                <span className="ml-2 text-primary">{parsedTitles.length} titles detected</span>
              )}
            </Label>
            <Textarea
              placeholder={"10 Things Nobody Tells You About...\nI Tried This For 30 Days and...\nThe Secret They Don't Want You to Know..."}
              value={titlesText}
              onChange={(e) => setTitlesText(e.target.value)}
              rows={10}
              className="bg-background border-border font-mono text-sm resize-none"
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
              onClick={handleAnalyze}
              disabled={mutation.isPending || parsedTitles.length === 0}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-sm"
            >
              {mutation.isPending ? "Analyzing..." : "Analyze Titles"}
            </Button>
          </div>

          {mutation.isError && (
            <p className="text-xs text-destructive font-mono bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
              Analysis failed. Please try again.
            </p>
          )}
        </CardContent>
      </Card>

      {mutation.isPending && (
        <Card className="border-border bg-card">
          <CardContent className="pt-6 space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      )}

      {result && !mutation.isPending && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider font-mono text-muted-foreground">
              Analysis Result
              <span className="ml-2 text-xs text-primary">#{result.id}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OutputViewer
              content={result.analysis}
              outputMode={outputMode}
              onModeChange={setOutputMode}
              filename={`title-analysis-${result.id}`}
            />
            <div className="mt-4 text-xs text-muted-foreground font-mono border-t border-border pt-3">
              Copy this analysis and use it in the Generate Titles page.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
