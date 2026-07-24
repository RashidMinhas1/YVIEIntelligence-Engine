import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Undo, Redo, Type, Check, RefreshCw, X, Maximize2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface PromptEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  minHeight?: string;
  id?: string;
}

export function PromptEditor({
  value = "",
  onChange,
  placeholder,
  className = "",
  readOnly = false,
  minHeight = "200px",
  id
}: PromptEditorProps) {
  // History State
  const [history, setHistory] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  
  // AI Toolbar State
  const [showAiToolbar, setShowAiToolbar] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  
  // Ref for outside click detection
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync external value changes into history if it diverges
  useEffect(() => {
    if (value !== history[historyIndex] && !isAiProcessing) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(value);
      // Keep last 50 edits
      if (newHistory.length > 50) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [value]);

  const updateValue = (newValue: string) => {
    if (newValue === value) return;
    onChange(newValue);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(i => i - 1);
      onChange(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(i => i + 1);
      onChange(history[historyIndex + 1]);
    }
  };

  const handleAiAction = async (action: "improve" | "expand" | "rewrite") => {
    if (!value.trim()) return;
    setIsAiProcessing(true);
    
    try {
      const prompt = action === "improve" 
        ? `Improve the grammar, tone, and impact of the following text, keeping its original meaning intact:\n\n${value}`
        : action === "expand"
        ? `Expand the following text to provide more detail, examples, and depth, while maintaining its original core message:\n\n${value}`
        : `Rewrite the following text from scratch to be more engaging and compelling, keeping the core message:\n\n${value}`;

      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, featureKey: "prompt_generator" })
      });
      
      if (!res.ok) throw new Error("AI processing failed");
      const data = await res.json();
      
      if (data.result) {
        updateValue(data.result);
      }
    } catch (e) {
      console.error("AI action failed:", e);
    } finally {
      setIsAiProcessing(false);
      setShowAiToolbar(false);
    }
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className={`relative flex flex-col border rounded-xl overflow-hidden bg-background focus-within:ring-2 focus-within:ring-primary/50 transition-shadow ${className}`} ref={containerRef}>
      
      {/* Editor Header / Toolbar */}
      {!readOnly && (
        <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 border-b border-border/50">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground" 
              onClick={undo} 
              disabled={historyIndex === 0 || isAiProcessing}
              title="Undo"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground" 
              onClick={redo} 
              disabled={historyIndex === history.length - 1 || isAiProcessing}
              title="Redo"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 text-xs flex items-center gap-1 ${showAiToolbar ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-primary"}`}
              onClick={() => setShowAiToolbar(!showAiToolbar)}
              disabled={isAiProcessing || !value.trim()}
            >
              <Wand2 className="h-3 w-3" />
              AI Tools
            </Button>
          </div>
        </div>
      )}

      {/* Floating AI Toolbar */}
      {showAiToolbar && !readOnly && (
        <div className="absolute top-12 right-2 bg-popover border border-border/50 shadow-xl rounded-lg p-1 z-10 flex flex-col gap-1 w-40 animate-in fade-in zoom-in duration-200">
          <Button variant="ghost" size="sm" className="justify-start text-xs h-8" onClick={() => handleAiAction("improve")}>
            <Check className="h-3 w-3 mr-2 text-green-500" /> Improve Writing
          </Button>
          <Button variant="ghost" size="sm" className="justify-start text-xs h-8" onClick={() => handleAiAction("expand")}>
            <Maximize2 className="h-3 w-3 mr-2 text-blue-500" /> Expand Length
          </Button>
          <Button variant="ghost" size="sm" className="justify-start text-xs h-8" onClick={() => handleAiAction("rewrite")}>
            <RefreshCw className="h-3 w-3 mr-2 text-orange-500" /> Rewrite
          </Button>
          <div className="border-t border-border/50 my-1"></div>
          <Button variant="ghost" size="sm" className="justify-start text-xs h-8 text-muted-foreground" onClick={() => setShowAiToolbar(false)}>
            <X className="h-3 w-3 mr-2" /> Close
          </Button>
        </div>
      )}

      {/* Main Text Area */}
      <Textarea
        id={id}
        value={value}
        onChange={(e) => updateValue(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly || isAiProcessing}
        className={`border-0 focus-visible:ring-0 resize-none rounded-none bg-transparent ${isAiProcessing ? "opacity-50" : ""}`}
        style={{ minHeight }}
      />
      
      {/* Loading Overlay */}
      {isAiProcessing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[1px] z-10">
          <RefreshCw className="h-6 w-6 text-primary animate-spin mb-2" />
          <span className="text-sm font-medium text-primary shadow-sm">AI is rewriting...</span>
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-secondary/10 border-t border-border/30 text-[10px] text-muted-foreground font-medium">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Type className="h-3 w-3" /> {wordCount} words</span>
          <span>{charCount} chars</span>
        </div>
        <div>
          {historyIndex > 0 ? "Edited" : "Original"}
        </div>
      </div>
    </div>
  );
}
