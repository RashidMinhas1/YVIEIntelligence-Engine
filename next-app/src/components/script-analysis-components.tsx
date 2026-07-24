import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Save } from "lucide-react";
import {
  ExecutiveSummary,
  ToneAnalysis,
  HookAnalysis,
  BodySection,
  StoryStage,
  CuriosityLoop,
  EmotionalTrigger,
  RetentionEvent,
  TransitionAnalysis,
  NarrationStyle,
  CtaAnalysis,
  FinalScore
} from "@/lib/types/script-analysis";

interface BaseProps {
  onSave: (type: string, data: any, tags: string[]) => void;
}

export function ExecutiveSummaryCard({ data, onSave }: { data: ExecutiveSummary } & BaseProps) {
  if (!data) return null;
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg font-bold font-mono">Executive Summary</CardTitle>
          <div className="text-xs text-muted-foreground font-mono mt-1">Topic: {data.videoTopic || "Unknown"} | Niche: {data.niche || "Unknown"}</div>
        </div>
        <Button variant="outline" size="sm" onClick={() => onSave("executive_summary", data, ["Reports"])}>
          <Save className="w-4 h-4 mr-2" /> Save Report
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="p-3 bg-background rounded-lg border border-border">
            <div className="text-[10px] text-muted-foreground uppercase font-mono mb-1">Video Type</div>
            <div className="text-sm font-bold">{data.videoType}</div>
          </div>
          <div className="p-3 bg-background rounded-lg border border-border">
            <div className="text-[10px] text-muted-foreground uppercase font-mono mb-1">AI Provider</div>
            <div className="text-sm font-bold capitalize">{data.aiProvider}</div>
          </div>
          <div className="p-3 bg-background rounded-lg border border-border">
            <div className="text-[10px] text-muted-foreground uppercase font-mono mb-1">Confidence Score</div>
            <div className="text-sm font-bold text-green-500">{data.overallConfidenceScore}/100</div>
          </div>
          <div className="p-3 bg-background rounded-lg border border-border">
            <div className="text-[10px] text-muted-foreground uppercase font-mono mb-1">Overall AI Rating</div>
            <div className="text-sm font-bold">{data.overallAiRating}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ScriptObjectiveCard({ data, onSave }: { data: string } & BaseProps) {
  if (!data) return null;
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold font-mono">Script Objective</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => onSave("objective", { objective: data }, ["Objectives"])}>
          <Save className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80 leading-relaxed">{data}</p>
      </CardContent>
    </Card>
  );
}

export function ToneAnalysisCard({ data, onSave }: { data: ToneAnalysis } & BaseProps) {
  if (!data) return null;
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold font-mono">Tone Analysis</CardTitle>
        <Button variant="outline" size="sm" onClick={() => onSave("tone", data, ["Tones"])}>
          <Save className="w-4 h-4 mr-2" /> Save Tone
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div><div className="text-[10px] text-muted-foreground uppercase">Primary Tone</div><div className="text-sm font-medium">{data.primaryTone}</div></div>
          <div><div className="text-[10px] text-muted-foreground uppercase">Secondary Tone</div><div className="text-sm font-medium">{data.secondaryTone}</div></div>
          <div><div className="text-[10px] text-muted-foreground uppercase">Narration Style</div><div className="text-sm font-medium">{data.narrationStyle}</div></div>
          <div><div className="text-[10px] text-muted-foreground uppercase">Voice Style</div><div className="text-sm font-medium">{data.voiceStyle}</div></div>
          <div><div className="text-[10px] text-muted-foreground uppercase">Pacing</div><div className="text-sm font-medium">{data.pacing}</div></div>
          <div><div className="text-[10px] text-muted-foreground uppercase">Emotion Curve</div><div className="text-sm font-medium">{data.emotionCurve}</div></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function HookAnalysisCard({ data, onSave }: { data: HookAnalysis } & BaseProps) {
  if (!data) return null;
  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-2 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base font-bold font-mono">Hook Analysis</CardTitle>
          <Badge variant="outline" className="mt-2">{data.hookType}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => onSave("hook", data, ["Hooks"])}>
          <Save className="w-4 h-4 mr-2" /> Save Hook
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-muted/30 rounded-md border border-border/50 text-sm italic">"{data.originalHook}"</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong className="text-xs uppercase text-muted-foreground block mb-1">Psychology</strong>{data.hookPsychology}</div>
          <div><strong className="text-xs uppercase text-muted-foreground block mb-1">Curiosity Type</strong>{data.curiosityType}</div>
          <div><strong className="text-xs uppercase text-muted-foreground block mb-1">Pattern Interrupt</strong>{data.patternInterrupt}</div>
          <div><strong className="text-xs uppercase text-muted-foreground block mb-1">Emotional Trigger</strong>{data.emotionalTrigger}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div><strong className="text-xs text-green-500 uppercase block mb-1">Why It Works</strong><p className="text-sm">{data.whyItWorks}</p></div>
          <div><strong className="text-xs text-amber-500 uppercase block mb-1">Suggested Improvement</strong><p className="text-sm">{data.suggestedImprovement}</p></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function BodyBreakdownCard({ data, onSave }: { data: BodySection[] } & BaseProps) {
  if (!data || !Array.isArray(data)) return null;
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold font-mono">Body Breakdown</h3>
      {data.map((section, idx) => (
        <Card key={idx}>
          <CardHeader className="pb-2 flex flex-row items-center justify-between bg-muted/10 border-b border-border/50">
            <CardTitle className="text-sm font-bold font-mono">Section {idx + 1}: {section.sectionTitle}</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onSave("script_component", section, ["Script Components"])}>
              <Save className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="p-3 bg-muted/20 rounded border border-border/50 text-xs font-mono line-clamp-3">"{section.originalContent}"</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div><strong className="uppercase text-muted-foreground block mb-1">Purpose</strong>{section.purpose}</div>
              <div><strong className="uppercase text-muted-foreground block mb-1">Story Function</strong>{section.storyFunction}</div>
              <div><strong className="uppercase text-muted-foreground block mb-1">Retention Tech</strong>{section.retentionTechnique}</div>
              <div><strong className="uppercase text-muted-foreground block mb-1">Transition</strong>{section.transition}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StoryStructureCard({ data, onSave }: { data: StoryStage[] } & BaseProps) {
  if (!data || !Array.isArray(data)) return null;
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold font-mono">Story Structure</CardTitle>
        <Button variant="outline" size="sm" onClick={() => onSave("story_structure", { stages: data }, ["Story Structures"])}>
          <Save className="w-4 h-4 mr-2" /> Save Structure
        </Button>
      </CardHeader>
      <CardContent>
        <div className="relative border-l-2 border-primary/20 ml-3 space-y-6 mt-4">
          {data.map((stage, idx) => (
            <div key={idx} className="relative pl-6">
              <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
              <h4 className="font-bold text-sm">{stage.stageName}</h4>
              <p className="text-xs text-muted-foreground mt-1 mb-2">{stage.purpose}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs p-2 bg-muted/10 rounded border border-border">
                <div><strong className="block text-muted-foreground mb-0.5">Psychology</strong>{stage.psychology}</div>
                <div><strong className="block text-muted-foreground mb-0.5">Why It Works</strong>{stage.whyItWorks}</div>
                <div><strong className="block text-muted-foreground mb-0.5">Retention</strong>{stage.retentionValue}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function CuriosityLoopsCard({ data, onSave }: { data: CuriosityLoop[] } & BaseProps) {
  if (!data || !Array.isArray(data)) return null;
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold font-mono">Curiosity Loops</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((loop, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-2 flex flex-row items-start justify-between">
              <Badge variant="secondary">Loop {idx + 1}</Badge>
              <Button variant="ghost" size="sm" onClick={() => onSave("curiosity_loop", loop, ["Psychology"])}>
                <Save className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm italic border-l-2 border-primary/50 pl-3 py-1">"{loop.originalLoop}"</div>
              <div className="text-xs space-y-2">
                <div><strong className="text-muted-foreground">Gap Created:</strong> {loop.gapCreated}</div>
                <div><strong className="text-muted-foreground">Payoff:</strong> {loop.payoff}</div>
                <div><strong className="text-muted-foreground">Strength:</strong> {loop.strength}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function EmotionalTriggersCard({ data, onSave }: { data: EmotionalTrigger[] } & BaseProps) {
  if (!data || !Array.isArray(data)) return null;
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold font-mono">Emotional Triggers</CardTitle>
        <Button variant="outline" size="sm" onClick={() => onSave("emotional_strategy", { triggers: data }, ["Psychology"])}>
          <Save className="w-4 h-4 mr-2" /> Save Strategy
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {data.map((t, idx) => (
            <div key={idx} className="flex items-start gap-4 p-3 rounded-lg border border-border bg-muted/5">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {t.score}/10
              </div>
              <div>
                <h4 className="font-bold text-sm">{t.emotion}</h4>
                <p className="text-xs text-muted-foreground mt-1">{t.explanation}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function RetentionStrategyCard({ data, onSave }: { data: RetentionEvent[] } & BaseProps) {
  if (!data || !Array.isArray(data)) return null;
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold font-mono">Retention Strategy Timeline</CardTitle>
        <Button variant="outline" size="sm" onClick={() => onSave("retention_strategy", { timeline: data }, ["Retention Strategies"])}>
          <Save className="w-4 h-4 mr-2" /> Save Strategy
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mt-4">
          {data.map((event, idx) => (
            <div key={idx} className="flex gap-4 items-start">
              <Badge variant="outline" className="shrink-0 w-16 justify-center font-mono">{event.timestamp}</Badge>
              <div className="bg-muted/10 p-3 rounded-md border border-border w-full text-xs space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div><strong className="text-muted-foreground block">Viewer Expectation</strong>{event.viewerExpectation}</div>
                  <div><strong className="text-muted-foreground block">Retention Technique</strong>{event.retentionTechnique}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TransitionAnalysisCard({ data, onSave }: { data: TransitionAnalysis[] } & BaseProps) {
  if (!data || !Array.isArray(data)) return null;
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold font-mono">Transition Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.map((transition, idx) => (
          <Card key={idx}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <Badge variant="outline">{transition.transitionType}</Badge>
              <Button variant="ghost" size="sm" onClick={() => onSave("transition", transition, ["Transitions"])}>
                <Save className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm italic border-l-2 border-primary/50 pl-3 py-1">"{transition.originalTransition}"</div>
              <div className="text-xs space-y-1">
                <p><strong className="text-muted-foreground">Why It Works:</strong> {transition.whyItWorks}</p>
                <p><strong className="text-muted-foreground">Psychology:</strong> {transition.psychology}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function NarrationStyleCard({ data, onSave }: { data: NarrationStyle } & BaseProps) {
  if (!data) return null;
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold font-mono">Narration Style</CardTitle>
        <Button variant="outline" size="sm" onClick={() => onSave("narration_style", data, ["Narration Styles"])}>
          <Save className="w-4 h-4 mr-2" /> Save Style
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          <div><div className="text-[10px] text-muted-foreground uppercase">Sentence Length</div><div className="text-sm">{data.sentenceLength}</div></div>
          <div><div className="text-[10px] text-muted-foreground uppercase">Vocabulary</div><div className="text-sm">{data.vocabulary}</div></div>
          <div><div className="text-[10px] text-muted-foreground uppercase">Reading Level</div><div className="text-sm">{data.readingLevel}</div></div>
          <div><div className="text-[10px] text-muted-foreground uppercase">Energy</div><div className="text-sm">{data.energy}</div></div>
          <div className="col-span-2"><div className="text-[10px] text-muted-foreground uppercase">Storytelling Style</div><div className="text-sm">{data.storytellingStyle}</div></div>
        </div>
      </CardContent>
    </Card>
  );
}

export function CtaAnalysisCard({ data, onSave }: { data: CtaAnalysis } & BaseProps) {
  if (!data) return null;
  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base font-bold font-mono">Call to Action (CTA)</CardTitle>
          <Badge variant="outline" className="mt-2">{data.ctaType}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => onSave("cta", data, ["CTAs"])}>
          <Save className="w-4 h-4 mr-2" /> Save CTA
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-muted/30 rounded-md border border-border/50 text-sm italic">"{data.originalCta}"</div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><strong className="text-xs uppercase text-muted-foreground block mb-1">Psychology</strong>{data.psychology}</div>
          <div><strong className="text-xs uppercase text-muted-foreground block mb-1">Strength</strong>{data.strength}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PromptUsedCard({ data, onSave }: { data: string } & BaseProps) {
  if (!data) return null;
  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold font-mono">Generated Prompt Used</CardTitle>
        <Button variant="outline" size="sm" onClick={() => onSave("prompt", { prompt: data }, ["Prompts"])}>
          <Save className="w-4 h-4 mr-2" /> Save Prompt
        </Button>
      </CardHeader>
      <CardContent>
        <div className="p-3 bg-foreground/5 rounded border border-border text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
          {data}
        </div>
      </CardContent>
    </Card>
  );
}

export function FinalScoreCard({ data, onSave }: { data: FinalScore } & BaseProps) {
  if (!data) return null;
  
  const scoreColor = (score: number) => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-amber-500";
    return "text-destructive";
  };

  return (
    <Card className="border-primary bg-primary/5">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold font-mono">Final Intelligence Score</CardTitle>
        <Button variant="outline" size="sm" onClick={() => onSave("intelligence_score", data, ["Reports"])}>
          <Save className="w-4 h-4 mr-2" /> Save Score
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-8 mt-4">
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className={`text-6xl font-black font-mono tracking-tighter ${scoreColor(data.overallScore)}`}>
              {data.overallScore}
            </div>
            <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground mt-2">Overall Score</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4 flex-1 w-full">
            {[
              { label: "Hook", val: data.hook },
              { label: "Story", val: data.story },
              { label: "Curiosity", val: data.curiosity },
              { label: "Retention", val: data.retention },
              { label: "CTA", val: data.cta },
              { label: "Emotion", val: data.emotion },
              { label: "Narrative", val: data.narrative },
            ].map((metric) => (
              <div key={metric.label} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span>{metric.label}</span>
                  <span className={scoreColor(metric.val)}>{metric.val}/100</span>
                </div>
                <Progress value={metric.val} className="h-1.5" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
