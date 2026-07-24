import { useState } from "react";
import { useGenerateScript, useGetScriptAnalyses, getGetScriptAnalysesQueryKey, useGetGeneratedScripts, getGetGeneratedScriptsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { OutputViewer } from "@/components/output-viewer";

export default function GenerateScript() {
  const [title, setTitle] = useState("");
  const [scriptAnalysis, setScriptAnalysis] = useState("");
  const [targetWordCount, setTargetWordCount] = useState("1000");
  const [outputMode, setOutputMode] = useState<"docs" | "text">("text");
  const [result, setResult] = useState<{ id: number; title: string; script: string; wordCount: number } | null>(null);
  const queryClient = useQueryClient();

  const { data: analysesData } = useGetScriptAnalyses({
    query: { queryKey: getGetScriptAnalysesQueryKey() },
  });

  const mutation = useGenerateScript({
    mutation: {
      onSuccess: (data) => {
        setResult({ id: data.id, title: data.title, script: data.script, wordCount: data.wordCount });
        queryClient.invalidateQueries({ queryKey: getGetGeneratedScriptsQueryKey() });
      },
    },
  });

  const handleGenerate = () => {
    if (!title.trim()) return;
    mutation.mutate({
      data: {
        title,
        scriptAnalysis: scriptAnalysis || undefined,
        targetWordCount: parseInt(targetWordCount) || 1000,
        outputMode,
      },
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Script Generator</h2>
        <p className="text-muted-foreground text-sm mt-1 font-mono">Generate a full retention-optimized YouTube script</p>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm uppercase tracking-wider font-mono text-muted-foreground">Script Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-mono text-muted-foreground uppercase">Video Title (required)</Label>
            <Input
              placeholder="Enter the title for your script..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-background border-border font-mono text-sm"
            />
          </div>

          {analysesData && analysesData.analyses.length > 0 && (
            <div className="space-y-1">
              <Label className="text-xs font-mono text-muted-foreground uppercase">Load Script Analysis from History</Label>
              <select
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm font-mono text-foreground"
                onChange={(e) => {
                  const found = analysesData.analyses.find((a) => String(a.id) === e.target.value);
                  if (found) setScriptAnalysis(found.analysis);
                }}
                defaultValue=""
              >
                <option value="" disabled>Select a previous script analysis...</option>
                {analysesData.analyses.map((a) => (
                  <option key={a.id} value={a.id}>
                    Analysis #{a.id} — {new Date(a.createdAt).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1">
            <Label className="text-xs font-mono text-muted-foreground uppercase">
              Script Analysis Reference (optional — paste from Analyze Script page)
            </Label>
            <Textarea
              placeholder="Paste your script analysis here to replicate the tone, hook style, and retention pattern..."
              value={scriptAnalysis}
              onChange={(e) => setScriptAnalysis(e.target.value)}
              rows={6}
              className="bg-background border-border font-mono text-sm resize-none"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-mono text-muted-foreground uppercase">
              Target Word Count
              <span className="ml-2 text-muted-foreground/60">(~{Math.round(parseInt(targetWordCount || "1000") / 150)} min read)</span>
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="200"
                max="5000"
                step="100"
                value={targetWordCount}
                onChange={(e) => setTargetWordCount(e.target.value)}
                className="bg-background border-border font-mono text-sm w-32"
              />
              <div className="flex gap-1">
                {["500", "1000", "1500", "2000"].map((w) => (
                  <button
                    key={w}
                    onClick={() => setTargetWordCount(w)}
                    className={`text-xs font-mono px-2 py-1 rounded border ${targetWordCount === w ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"}`}
                  >
                    {w}w
                  </button>
                ))}
              </div>
            </div>
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
              disabled={mutation.isPending || !title.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 font-mono text-sm"
            >
              {mutation.isPending ? "Generating Script..." : "Generate Script"}
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

          {mutation.isError && (
            <p className="text-xs text-destructive font-mono bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
              Script generation failed. Please try again.
            </p>
          )}
        </CardContent>
      </Card>

      {mutation.isPending && (
        <Card className="border-border bg-card">
          <CardContent className="pt-6 space-y-3">
            <p className="text-xs font-mono text-muted-foreground">Writing your script with high-retention hooks...</p>
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className={`h-4 ${i % 3 === 0 ? "w-2/3" : i % 2 === 0 ? "w-5/6" : "w-full"}`} />
            ))}
          </CardContent>
        </Card>
      )}

      {result && !mutation.isPending && (
        <Card className="border-border bg-card">
          <CardHeader>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-sm uppercase tracking-wider font-mono text-muted-foreground">
                  Generated Script <span className="text-primary">#{result.id}</span>
                </CardTitle>
                <p className="text-sm text-foreground mt-1 font-medium">"{result.title}"</p>
              </div>
              <Badge variant="outline" className="text-xs font-mono text-primary border-primary/30 shrink-0">
                {result.wordCount} words
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <OutputViewer
              content={result.script}
              outputMode={outputMode}
              onModeChange={setOutputMode}
              filename={`script-${result.id}`}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
