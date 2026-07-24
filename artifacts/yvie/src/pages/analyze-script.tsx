import { useState } from "react";
import { useAnalyzeScript } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetScriptAnalysesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { OutputViewer } from "@/components/output-viewer";

export default function AnalyzeScript() {
  const [script, setScript] = useState("");
  const [outputMode, setOutputMode] = useState<"docs" | "text">("docs");
  const [result, setResult] = useState<{ analysis: string; id: number } | null>(null);
  const queryClient = useQueryClient();

  const wordCount = script.split(/\s+/).filter((w) => w.length > 0).length;

  const mutation = useAnalyzeScript({
    mutation: {
      onSuccess: (data) => {
        setResult({ analysis: data.analysis, id: data.id });
        queryClient.invalidateQueries({ queryKey: getGetScriptAnalysesQueryKey() });
      },
    },
  });

  const handleAnalyze = () => {
    if (!script.trim()) return;
    mutation.mutate({ data: { script, outputMode } });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Script Analyzer</h2>
        <p className="text-muted-foreground text-sm mt-1 font-mono">Extract tone, hook, and retention formula from any YouTube script</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider font-mono text-muted-foreground">Competitor Script</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-mono text-muted-foreground uppercase flex items-center justify-between">
              <span>Paste the script here</span>
              {wordCount > 0 && <span className="text-primary">{wordCount} words</span>}
            </Label>
            <Textarea
              placeholder="Paste a competitor's YouTube script here. You can get transcripts from tools like Genelify, YouTube's auto-generated captions, or other transcript extraction tools."
              value={script}
              onChange={(e) => setScript(e.target.value)}
              rows={14}
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
              disabled={mutation.isPending || !script.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-sm"
            >
              {mutation.isPending ? "Analyzing..." : "Analyze Script"}
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
            <p className="text-xs font-mono text-muted-foreground">Extracting tone, hook structure, and retention patterns...</p>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </CardContent>
        </Card>
      )}

      {result && !mutation.isPending && (
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider font-mono text-muted-foreground">
              Script Analysis
              <span className="ml-2 text-xs text-primary">#{result.id}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OutputViewer
              content={result.analysis}
              outputMode={outputMode}
              onModeChange={setOutputMode}
              filename={`script-analysis-${result.id}`}
            />
            <div className="mt-4 text-xs text-muted-foreground font-mono border-t border-border pt-3">
              Copy this analysis and use it in the Generate Script page for best results.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
