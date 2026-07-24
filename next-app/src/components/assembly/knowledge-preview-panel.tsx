"use client";

import React from "react";
import { KnowledgeObject } from "@/lib/types/knowledge-object";
import { X, Play, Hash, Target, Zap, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function KnowledgePreviewPanel({
  object,
  onClose
}: {
  object: KnowledgeObject | null;
  onClose: () => void;
}) {
  if (!object) return null;

  return (
    <div className="absolute top-0 right-0 bottom-0 w-80 bg-background border-l border-border shadow-2xl z-50 flex flex-col transform transition-transform animate-in slide-in-from-right">
      <div className="flex items-center justify-between p-4 border-b border-border bg-muted/10">
        <h3 className="font-bold font-mono text-sm uppercase flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary" /> Preview
        </h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-sm">
        <div>
          <Badge className="mb-2 text-[10px]">{object.category}</Badge>
          <h2 className="font-bold text-lg leading-tight">{object.title}</h2>
          <p className="text-xs text-muted-foreground mt-1">{object.description}</p>
        </div>

        <div className="space-y-1.5">
          <h4 className="font-mono text-[10px] uppercase text-muted-foreground flex items-center gap-1">
            <Target className="w-3 h-3" /> Core Content
          </h4>
          <div className="bg-muted/30 p-2.5 rounded text-xs border border-border">
            {object.extractedContent}
          </div>
        </div>

        <div className="space-y-1.5">
          <h4 className="font-mono text-[10px] uppercase text-muted-foreground">Why It Works</h4>
          <p className="text-xs">{object.whyItWorks}</p>
        </div>

        {object.strengths?.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="font-mono text-[10px] uppercase text-muted-foreground">Strengths</h4>
            <ul className="list-disc pl-4 text-xs space-y-0.5">
              {object.strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
        )}

        <div className="space-y-2 pt-2 border-t border-border">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground font-mono text-[10px] uppercase block">Provider</span>
              {object.metadata.provider}
            </div>
            <div>
              <span className="text-muted-foreground font-mono text-[10px] uppercase block">Usefulness</span>
              {object.scores.usefulnessScore}/100
            </div>
          </div>
        </div>

        {object.relationships?.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-border">
            <h4 className="font-mono text-[10px] uppercase text-muted-foreground flex items-center gap-1">
              <LinkIcon className="w-3 h-3" /> Recommended Pairings
            </h4>
            <ul className="text-xs space-y-1">
              {object.relationships.map((r, i) => (
                <li key={i} className="flex gap-1 text-[10px]">
                  <span className="font-bold text-primary">{r.type.replace(/_/g, " ")}:</span> {r.targetType}
                </li>
              ))}
            </ul>
          </div>
        )}

        {object.metadata.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2">
            {object.metadata.tags.map(t => (
              <Badge key={t} variant="outline" className="text-[9px]"><Hash className="w-2 h-2 mr-0.5" />{t}</Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
