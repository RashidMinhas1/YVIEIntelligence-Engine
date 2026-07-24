"use client";

import { KnowledgeObject } from "@/lib/types/knowledge-object";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Copy, Bookmark, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { SaveToLibraryModal, LibraryItemPayload } from "@/components/save-to-library-modal";

interface KnowledgeModuleCardProps {
  module: KnowledgeObject;
}

export function KnowledgeModuleCard({ module }: KnowledgeModuleCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(module.extractedContent);
    toast.success("Copied to clipboard!");
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-500 bg-green-500/10";
    if (score >= 75) return "text-blue-500 bg-blue-500/10";
    if (score >= 60) return "text-yellow-500 bg-yellow-500/10";
    return "text-red-500 bg-red-500/10";
  };

  const savePayload: LibraryItemPayload = {
    type: module.category,
    title: module.title,
    content: module,
    summary: module.description,
    metadata: module.metadata,
    tags: module.metadata?.tags || [],
  };

  return (
    <>
      <Card className="flex flex-col h-full bg-card/50 hover:bg-card/80 transition-colors border-white/5">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
                  {module.type}
                </Badge>
                {module.scores?.usefulnessScore && (
                  <Badge variant="secondary" className={`text-xs ${getScoreColor(module.scores.usefulnessScore)}`}>
                    Score: {module.scores.usefulnessScore}
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg leading-tight">{module.title}</CardTitle>
              <CardDescription className="text-sm line-clamp-2">
                {module.description}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyToClipboard} title="Copy Content">
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSaveModalOpen(true)} title="Save to Library">
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 pb-4">
          <div className="bg-muted/50 rounded-md p-4 text-sm font-medium border border-white/5">
            {module.extractedContent}
          </div>
          
          {expanded && (
            <div className="mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {module.originalContent && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Original Context</p>
                  <p className="text-sm italic text-muted-foreground bg-background/50 p-3 rounded-md border border-white/5">
                    "{module.originalContent}"
                  </p>
                </div>
              )}

              {module.whyItWorks && (
                <div className="space-y-1">
                  <p className="text-xs text-primary font-semibold flex items-center gap-1 uppercase tracking-wider">
                    <Lightbulb className="w-3 h-3" /> Why It Works
                  </p>
                  <p className="text-sm text-foreground/90">{module.whyItWorks}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {module.strengths && module.strengths.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-green-500 font-semibold flex items-center gap-1 uppercase tracking-wider">
                      <TrendingUp className="w-3 h-3" /> Strengths
                    </p>
                    <ul className="list-disc list-inside text-sm text-foreground/80 space-y-1">
                      {module.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {module.weaknesses && module.weaknesses.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs text-yellow-500 font-semibold flex items-center gap-1 uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3" /> Weaknesses
                    </p>
                    <ul className="list-disc list-inside text-sm text-foreground/80 space-y-1">
                      {module.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {module.improvementSuggestions && module.improvementSuggestions.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-white/5">
                  <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Suggested Improvements</p>
                  <ul className="list-disc list-inside text-sm text-foreground/80 space-y-1">
                    {module.improvementSuggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-0 pb-2">
          <Button 
            variant="ghost" 
            className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <><ChevronUp className="mr-2 h-3 w-3" /> Show Less</>
            ) : (
              <><ChevronDown className="mr-2 h-3 w-3" /> View Full Analysis</>
            )}
          </Button>
        </CardFooter>
      </Card>

      <SaveToLibraryModal 
        open={saveModalOpen} 
        onOpenChange={setSaveModalOpen} 
        payload={savePayload} 
      />
    </>
  );
}
