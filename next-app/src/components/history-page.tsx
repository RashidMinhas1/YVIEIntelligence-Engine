"use client";

import { useState } from "react";
import { useGetTitleAnalyses, useGetScriptAnalyses, useGetGeneratedScripts } from "@/integrations/api-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { OutputViewer } from "@/components/output-viewer";

type Tab = "titles" | "scripts" | "generated";

export default function History() {
  const [tab, setTab] = useState<Tab>("generated");
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: titleData, isLoading: titleLoading } = useGetTitleAnalyses();
  const { data: scriptData, isLoading: scriptLoading } = useGetScriptAnalyses();
  const { data: genData, isLoading: genLoading } = useGetGeneratedScripts();

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "generated", label: "Generated Scripts", count: genData?.scripts.length ?? 0 },
    { key: "titles", label: "Title Analyses", count: titleData?.analyses.length ?? 0 },
    { key: "scripts", label: "Script Analyses", count: scriptData?.analyses.length ?? 0 },
  ];

  const isLoading = tab === "titles" ? titleLoading : tab === "scripts" ? scriptLoading : genLoading;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">History</h2>
        <p className="text-muted-foreground text-sm mt-1 font-mono">All saved analyses and generated content</p>
      </div>

      <div className="flex gap-1 border-b border-border">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setExpanded(null); }}
            className={`px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors border-b-2 -mb-px ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t.label}
            {t.count > 0 && (
              <span className="ml-2 text-xs text-primary/70">({t.count})</span>
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {tab === "generated" && (genData?.scripts ?? []).map((s) => (
            <Card key={s.id} className="border-border bg-card">
              <CardHeader
                className="pb-2 cursor-pointer"
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-primary shrink-0">#{s.id}</span>
                    <CardTitle className="text-sm font-medium text-foreground truncate">"{s.title}"</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs font-mono">{s.wordCount}w</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{new Date(s.createdAt).toLocaleDateString()}</span>
                    <span className="text-xs text-muted-foreground font-mono">{expanded === s.id ? "▲" : "▼"}</span>
                  </div>
                </div>
              </CardHeader>
              {expanded === s.id && (
                <CardContent>
                  <OutputViewer
                    content={s.script}
                    outputMode={s.outputMode as "docs" | "text"}
                    showModeToggle={false}
                    filename={`script-${s.id}`}
                    libraryPayload={{
                      type: "script",
                      title: s.title || `Generated Script #${s.id}`,
                      content: { fullScript: s.script },
                      summary: `Generated script with ${s.wordCount} words`,
                      tags: ["generated-script"]
                    }}
                  />
                </CardContent>
              )}
            </Card>
          ))}

          {tab === "titles" && (titleData?.analyses ?? []).map((a) => (
            <Card key={a.id} className="border-border bg-card">
              <CardHeader
                className="pb-2 cursor-pointer"
                onClick={() => setExpanded(expanded === a.id ? null : a.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-primary shrink-0">#{a.id}</span>
                    <CardTitle className="text-sm font-medium text-foreground truncate">
                      {a.titles.slice(0, 2).join(", ")}
                      {a.titles.length > 2 && `... +${a.titles.length - 2} more`}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs font-mono">{a.titles.length} titles</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{new Date(a.createdAt).toLocaleDateString()}</span>
                    <span className="text-xs text-muted-foreground font-mono">{expanded === a.id ? "▲" : "▼"}</span>
                  </div>
                </div>
              </CardHeader>
              {expanded === a.id && (
                <CardContent>
                  <OutputViewer
                    content={a.analysis}
                    outputMode={a.outputMode as "docs" | "text"}
                    showModeToggle={false}
                    filename={`title-analysis-${a.id}`}
                    libraryPayload={{
                      type: "report",
                      title: `Title Analysis #${a.id}`,
                      content: { analysis: a.analysis },
                      summary: `Title analysis report`,
                      tags: ["title-analysis"]
                    }}
                  />
                </CardContent>
              )}
            </Card>
          ))}

          {tab === "scripts" && (scriptData?.analyses ?? []).map((a) => (
            <Card key={a.id} className="border-border bg-card">
              <CardHeader
                className="pb-2 cursor-pointer"
                onClick={() => setExpanded(expanded === a.id ? null : a.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-primary shrink-0">#{a.id}</span>
                    <CardTitle className="text-sm text-muted-foreground truncate">{a.scriptPreview}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground font-mono">{new Date(a.createdAt).toLocaleDateString()}</span>
                    <span className="text-xs text-muted-foreground font-mono">{expanded === a.id ? "▲" : "▼"}</span>
                  </div>
                </div>
              </CardHeader>
              {expanded === a.id && (
                <CardContent>
                  <OutputViewer
                    content={a.analysis}
                    outputMode={a.outputMode as "docs" | "text"}
                    showModeToggle={false}
                    filename={`script-analysis-${a.id}`}
                    libraryPayload={{
                      type: "report",
                      title: `Script Analysis #${a.id}`,
                      content: { analysis: a.analysis },
                      summary: `Script analysis report`,
                      tags: ["script-analysis"]
                    }}
                  />
                </CardContent>
              )}
            </Card>
          ))}

          {((tab === "generated" && !genData?.scripts.length) ||
            (tab === "titles" && !titleData?.analyses.length) ||
            (tab === "scripts" && !scriptData?.analyses.length)) && (
            <div className="text-center py-16 text-muted-foreground text-sm font-mono">
              Nothing here yet. Start using the tools to build your history.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
