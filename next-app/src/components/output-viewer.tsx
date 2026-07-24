import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SaveToLibraryModal, LibraryItemPayload } from "./save-to-library-modal";
import { Save } from "lucide-react";

interface OutputViewerProps {
  content: string;
  outputMode: "docs" | "text";
  onModeChange?: (mode: "docs" | "text") => void;
  showModeToggle?: boolean;
  filename?: string;
  libraryPayload?: LibraryItemPayload;
}

export function OutputViewer({ content, outputMode, onModeChange, showModeToggle = true, filename = "output", libraryPayload }: OutputViewerProps) {
  const [copied, setCopied] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

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
          {libraryPayload && (
            <Button size="sm" variant="default" onClick={() => setShowSaveModal(true)} className="text-xs font-mono h-7 px-3 bg-indigo-600 hover:bg-indigo-700 text-white">
              <Save className="w-3 h-3 mr-1.5" /> Save to Library
            </Button>
          )}
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
        <pre className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">{content}</pre>
      </div>

      {libraryPayload && (
         <SaveToLibraryModal
           open={showSaveModal}
           onOpenChange={setShowSaveModal}
           payload={libraryPayload}
         />
      )}
    </div>
  );
}
