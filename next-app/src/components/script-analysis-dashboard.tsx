"use client";

import React, { useState } from "react";
import { ScriptAnalysisData } from "@/lib/types/script-analysis";
import { KnowledgeExtractionJSON } from "@/lib/types/knowledge-object";
import { SaveToLibraryModal, LibraryItemPayload } from "./save-to-library-modal";
import { KnowledgeModuleCard } from "./knowledge-module-card";
import { repairTruncatedJson } from "@/lib/utils";
import {
  ExecutiveSummaryCard,
  ScriptObjectiveCard,
  ToneAnalysisCard,
  HookAnalysisCard,
  BodyBreakdownCard,
  StoryStructureCard,
  CuriosityLoopsCard,
  EmotionalTriggersCard,
  RetentionStrategyCard,
  TransitionAnalysisCard,
  NarrationStyleCard,
  CtaAnalysisCard,
  PromptUsedCard,
  FinalScoreCard
} from "./script-analysis-components";
import ReactMarkdown from "react-markdown";
import { BookmarkPlus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScriptAnalysisDashboardProps {
  analysisJson: string;
  competitorVideoUrl?: string;
  competitorChannelName?: string;
  competitorTitle?: string;
  niche?: string;
}

export function ScriptAnalysisDashboard({
  analysisJson,
  competitorVideoUrl,
  competitorChannelName,
  competitorTitle,
  niche
}: ScriptAnalysisDashboardProps) {
  const [savePayload, setSavePayload] = useState<LibraryItemPayload | null>(null);

  // Safely parse JSON, including auto-repair for truncated AI outputs
  let data: ScriptAnalysisData | KnowledgeExtractionJSON | null = null;
  const parsed = repairTruncatedJson(analysisJson);
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Object.keys(parsed).length > 0) {
    data = parsed.data || parsed;
  }

  const isMarkdown = !data;
  
  // Parse markdown sections
  const markdownSections: { title: string, content: string }[] = [];
  if (isMarkdown) {
    const parts = analysisJson.split(/(?=\n##\s+)/);
    for (const part of parts) {
      const match = part.match(/^\n?##\s+(.*)\n([\s\S]*)$/);
      if (match) {
        markdownSections.push({ title: match[1].trim(), content: match[2].trim() });
      } else if (part.trim() && !part.startsWith("\`\`\`")) {
        // Fallback for text before any ##
        if (markdownSections.length === 0) {
          markdownSections.push({ title: "Overview", content: part.trim() });
        }
      }
    }
  }

  if (!data && markdownSections.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground bg-muted/10 rounded-lg border border-border">
        Could not parse intelligence data. Raw output:
        <pre className="text-xs text-left mt-4 overflow-x-auto p-4 bg-background border border-border rounded">{analysisJson}</pre>
      </div>
    );
  }

  const isKnowledgeObjects = data && "objects" in data && Array.isArray((data as KnowledgeExtractionJSON).objects);

  const handleSave = (type: string, contentData: any, defaultTags: string[], rawText?: string, context?: string) => {
    let validItemType: "title" | "script" | "hook" | "cta" | "thumbnail" | "report" | string = "report";
    if (type.includes("hook")) validItemType = "hook";
    else if (type.includes("cta")) validItemType = "cta";
    else if (type.includes("story")) validItemType = "script";

    setSavePayload({
      type: validItemType as any,
      title: `${competitorTitle ? competitorTitle + ' - ' : ''}${type.replace('_', ' ').toUpperCase()}`,
      content: contentData,
      rawTextToExtract: rawText,
      originalScriptContext: context,
      summary: `Extracted ${type.replace('_', ' ')} from ${competitorChannelName || 'Competitor'}`,
      tags: defaultTags,
      metadata: {
        provider: "ai",
        competitorChannelName,
        sourceVideoUrl: competitorVideoUrl,
        sourceVideoTitle: competitorTitle,
        niche,
        extractedAt: new Date().toISOString()
      }
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {isKnowledgeObjects ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(data as KnowledgeExtractionJSON).objects.map((module) => {
             if (!module.metadata) module.metadata = {} as any;
             if (!module.metadata.competitorChannel) module.metadata.competitorChannel = competitorChannelName || "";
             if (!module.metadata.videoUrl) module.metadata.videoUrl = competitorVideoUrl || "";
             if (!module.metadata.competitorVideo) module.metadata.competitorVideo = competitorTitle || "";
             if (!module.metadata.niche) module.metadata.niche = niche || "";
             
             return <KnowledgeModuleCard key={module.id} module={module} />;
          })}
        </div>
      ) : (
        <>
          {isMarkdown ? (
            <div className="grid grid-cols-1 gap-6">
              {markdownSections.map((sec, idx) => (
                <div key={idx} className="bg-card border border-border/50 shadow-sm rounded-xl overflow-hidden hover:border-primary/30 transition-colors group">
                  <div className="px-5 py-4 border-b border-border/50 bg-muted/20 flex items-center justify-between">
                    <h3 className="font-semibold text-lg text-card-foreground flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      {sec.title}
                    </h3>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleSave(
                         sec.title.toLowerCase(), 
                         { text: sec.content }, 
                         ["extracted", sec.title.toLowerCase()],
                         `## ${sec.title}\n${sec.content}`,
                         analysisJson
                      )}
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>Save to Library</span>
                    </Button>
                  </div>
                  <div className="p-5">
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-primary prose-a:text-blue-500">
                      <ReactMarkdown>{sec.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {(data as ScriptAnalysisData).executiveSummary && <ExecutiveSummaryCard data={(data as ScriptAnalysisData).executiveSummary!} onSave={handleSave} />}
              {(data as ScriptAnalysisData).finalScore && <FinalScoreCard data={(data as ScriptAnalysisData).finalScore!} onSave={handleSave} />}
              {(data as ScriptAnalysisData).scriptObjective && <ScriptObjectiveCard data={(data as ScriptAnalysisData).scriptObjective!} onSave={handleSave} />}
              {(data as ScriptAnalysisData).toneAnalysis && <ToneAnalysisCard data={(data as ScriptAnalysisData).toneAnalysis!} onSave={handleSave} />}
              {(data as ScriptAnalysisData).hookAnalysis && <HookAnalysisCard data={(data as ScriptAnalysisData).hookAnalysis!} onSave={handleSave} />}
              {(data as ScriptAnalysisData).storyStructure && <StoryStructureCard data={(data as ScriptAnalysisData).storyStructure!} onSave={handleSave} />}
              {(data as ScriptAnalysisData).bodyBreakdown && <BodyBreakdownCard data={(data as ScriptAnalysisData).bodyBreakdown!} onSave={handleSave} />}
              {(data as ScriptAnalysisData).curiosityLoops && <CuriosityLoopsCard data={(data as ScriptAnalysisData).curiosityLoops!} onSave={handleSave} />}
              {(data as ScriptAnalysisData).emotionalTriggers && <EmotionalTriggersCard data={(data as ScriptAnalysisData).emotionalTriggers!} onSave={handleSave} />}
              {(data as ScriptAnalysisData).retentionStrategy && <RetentionStrategyCard data={(data as ScriptAnalysisData).retentionStrategy!} onSave={handleSave} />}
              {(data as ScriptAnalysisData).transitionAnalysis && <TransitionAnalysisCard data={(data as ScriptAnalysisData).transitionAnalysis!} onSave={handleSave} />}
              {(data as ScriptAnalysisData).narrationStyle && <NarrationStyleCard data={(data as ScriptAnalysisData).narrationStyle!} onSave={handleSave} />}
              {(data as ScriptAnalysisData).ctaAnalysis && <CtaAnalysisCard data={(data as ScriptAnalysisData).ctaAnalysis!} onSave={handleSave} />}
              {(data as ScriptAnalysisData).promptUsed && <PromptUsedCard data={(data as ScriptAnalysisData).promptUsed!} onSave={handleSave} />}
            </>
          )}
          
          <SaveToLibraryModal 
            open={!!savePayload} 
            onOpenChange={(open) => !open && setSavePayload(null)} 
            payload={savePayload} 
          />
        </>
      )}
    </div>
  );
}
