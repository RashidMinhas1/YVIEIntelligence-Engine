"use client";

import React, { useMemo, useState, useEffect } from "react";
import { AssemblySelection, AIMemoryProfile, KnowledgeObject } from "@/lib/types/knowledge-object";
import { compileLivePrompt } from "@/lib/assembly/engine";
import { Terminal, RefreshCcw } from "lucide-react";

export function LivePromptPreview({
  selections,
  objects,
  memoryProfile,
  topic,
  wordCount,
  onChange
}: {
  selections: AssemblySelection[];
  objects: KnowledgeObject[];
  memoryProfile: AIMemoryProfile;
  topic: string;
  wordCount: string;
  onChange?: (prompt: string | null) => void;
}) {
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const [manualPrompt, setManualPrompt] = useState("");

  const autoPrompt = useMemo(() => {
    return compileLivePrompt(selections, objects, memoryProfile, topic || "[Topic Not Set]", wordCount);
  }, [selections, objects, memoryProfile, topic, wordCount]);

  // Sync autoPrompt if not manually edited
  useEffect(() => {
    if (!isManuallyEdited) {
      setManualPrompt(autoPrompt);
    }
  }, [autoPrompt, isManuallyEdited]);

  const handleEdit = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setIsManuallyEdited(true);
    setManualPrompt(e.target.value);
    onChange?.(e.target.value);
  };

  const handleReset = () => {
    setIsManuallyEdited(false);
    setManualPrompt(autoPrompt);
    onChange?.(null);
  };

  return (
    <div className="flex-1 flex flex-col border border-border rounded-lg bg-black text-green-400 font-mono overflow-hidden">
      <div className="bg-muted/20 border-b border-border/50 px-3 py-1.5 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <div className="flex items-center gap-2">
          <Terminal className="w-3 h-3" /> 
          Live Master Prompt {isManuallyEdited && <span className="text-amber-500">(Edited)</span>}
        </div>
        {isManuallyEdited && (
          <button onClick={handleReset} className="hover:text-foreground flex items-center gap-1 transition-colors">
            <RefreshCcw className="w-3 h-3" /> Reset Auto-Sync
          </button>
        )}
      </div>
      <textarea 
        className="w-full h-full p-3 overflow-auto text-[11px] leading-relaxed whitespace-pre-wrap flex-1 bg-transparent border-none outline-none resize-none custom-scrollbar text-green-400 font-mono"
        value={manualPrompt}
        onChange={handleEdit}
        spellCheck={false}
      />
    </div>
  );
}
