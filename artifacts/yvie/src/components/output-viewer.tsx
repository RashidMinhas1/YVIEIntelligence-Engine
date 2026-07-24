import { useState } from "react";
import { Button } from "@/components/ui/button";

interface OutputViewerProps {
  content: string;
  outputMode: "docs" | "text";
  onModeChange?: (mode: "docs" | "text") => void;
  showModeToggle?: boolean;
  filename?: string;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-1 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-6 mb-2 text-primary border-b border-border pb-1">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-xl font-black mt-6 mb-3 text-primary">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm text-muted-foreground leading-relaxed">• $1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 text-sm text-muted-foreground leading-relaxed">$1. $2</li>')
    .replace(/`(.+?)`/g, '<code class="bg-muted text-primary text-xs px-1 py-0.5 rounded font-mono">$1</code>')
    .replace(/\n\n/g, '</p><p class="text-sm text-muted-foreground leading-relaxed my-2">')
    .replace(/^(?!<[h|l])(.+)$/gm, (line) => {
      if (line.startsWith('<') || !line.trim()) return line;
      return `<span class="text-sm text-muted-foreground">${line}</span>`;
    });
}

export function OutputViewer({ content, outputMode, onModeChange, showModeToggle = true, filename = "output" }: OutputViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (ext: "txt" | "md") => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        {showModeToggle && onModeChange && (
          <div className="flex rounded-md border border-border overflow-hidden">
            <button
              onClick={() => onModeChange("docs")}
              className={`px-3 py-1.5 text-xs font-mono transition-colors ${outputMode === "docs" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
            >
              Docs
            </button>
            <button
              onClick={() => onModeChange("text")}
              className={`px-3 py-1.5 text-xs font-mono transition-colors border-l border-border ${outputMode === "text" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"}`}
            >
              Plain Text
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={handleCopy} className="text-xs font-mono h-7 px-3">
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDownload("txt")} className="text-xs font-mono h-7 px-3">
            .txt
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDownload("md")} className="text-xs font-mono h-7 px-3">
            .md
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-background min-h-[200px] max-h-[600px] overflow-y-auto p-5">
        {outputMode === "docs" ? (
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        ) : (
          <pre className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">{content}</pre>
        )}
      </div>
    </div>
  );
}
