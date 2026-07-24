"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslation, useTranslationHistory } from "@/hooks/use-translation";
import { useGlossary } from "@/hooks/use-glossary";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { PromptEditor } from "@/components/ui/prompt-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Languages,
  Loader2,
  Copy,
  Check,
  Trash2,
  Plus,
  Clock,
  BookOpen,
  Zap,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  ArrowLeftRight,
} from "lucide-react";
import {
  TranslationMode,
  ContentType,
  TranslationResponse,
  GlossaryEntry,
} from "@/lib/translation/translation";
import { SUPPORTED_LANGUAGES } from "@/lib/translation/languages";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const TRANSLATION_MODES: { value: TranslationMode; label: string; description: string }[] = [
  { value: "literal", label: "Literal", description: "Maximum fidelity, word-by-word" },
  { value: "natural", label: "Natural", description: "Native fluency, natural flow" },
  { value: "professional", label: "Professional", description: "Formal register, publication-ready" },
  { value: "creator", label: "Creator", description: "Preserves creator personality and voice" },
  { value: "localization", label: "Localization", description: "Cultural adaptation while preserving intent" },
];

const CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "title", label: "YouTube Title" },
  { value: "hook", label: "Hook" },
  { value: "opening", label: "Opening" },
  { value: "script", label: "Full Script" },
  { value: "cta", label: "Call to Action" },
  { value: "ending", label: "Ending" },
  { value: "shorts_script", label: "Shorts Script" },
  { value: "description", label: "Video Description" },
  { value: "community_post", label: "Community Post" },
  { value: "seo_tags", label: "SEO Tags" },
  { value: "chapters", label: "Chapters" },
  { value: "thumbnail_text", label: "Thumbnail Text" },
  { value: "voice_over", label: "Voice Over" },
  { value: "ai_prompt", label: "AI Prompt" },
  { value: "research_notes", label: "Research Notes" },
  { value: "intelligence_report", label: "Intelligence Report" },
  { value: "strategy_report", label: "Strategy Report" },
  { value: "markdown_document", label: "Markdown Document" },
  { value: "rich_text", label: "Rich Text" },
  { value: "plain_text", label: "Plain Text" },
  { value: "knowledge_content", label: "Knowledge Content" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Quality Score Badge
// ─────────────────────────────────────────────────────────────────────────────

function QualityBadge({ score }: { score: number }) {
  const color =
    score >= 85
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : score >= 70
      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
      : "bg-red-500/20 text-red-400 border-red-500/30";

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {score}% Quality
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Glossary Panel
// ─────────────────────────────────────────────────────────────────────────────

function GlossaryPanel({ sourceLang, targetLang }: { sourceLang: string; targetLang: string }) {
  const { glossary, isLoading, createGlossaryEntry, deleteGlossaryEntry, isCreating } = useGlossary({
    sourceLanguage: sourceLang !== "auto" ? sourceLang : undefined,
    targetLanguage: targetLang,
  });
  const [newSource, setNewSource] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const handleAdd = async () => {
    if (!newSource.trim() || !newTarget.trim()) return;
    await createGlossaryEntry({
      sourceTerm: newSource.trim(),
      targetTerm: newTarget.trim(),
      sourceLanguage: sourceLang !== "auto" ? sourceLang : "en",
      targetLanguage: targetLang,
      notes: newNotes.trim() || undefined,
    });
    setNewSource("");
    setNewTarget("");
    setNewNotes("");
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-muted-foreground">
        Locked terms are always translated exactly as specified, overriding AI judgment.
      </div>

      {/* Add new entry */}
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs">Source Term</Label>
          <Input
            value={newSource}
            onChange={(e) => setNewSource(e.target.value)}
            placeholder="e.g. Brand Name"
            className="h-8 text-xs"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Target Term</Label>
          <Input
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            placeholder="e.g. Nom de Marque"
            className="h-8 text-xs"
          />
        </div>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={!newSource.trim() || !newTarget.trim() || isCreating}
          className="h-8"
        >
          {isCreating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
        </Button>
      </div>

      {/* Glossary list */}
      {isLoading ? (
        <div className="text-xs text-muted-foreground">Loading glossary...</div>
      ) : glossary.length === 0 ? (
        <div className="text-xs text-muted-foreground italic">No locked terms yet.</div>
      ) : (
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          {glossary.map((entry: GlossaryEntry) => (
            <div
              key={entry.id}
              className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs"
            >
              <span className="font-medium text-foreground">{entry.sourceTerm}</span>
              <ArrowLeftRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
              <span className="font-medium text-primary">{entry.targetTerm}</span>
              <button
                className="ml-auto text-muted-foreground hover:text-destructive transition-colors"
                onClick={() => deleteGlossaryEntry(entry.id)}
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// History Panel
// ─────────────────────────────────────────────────────────────────────────────

function HistoryPanel({ onRestore }: { onRestore: (item: { source: string; translated: string }) => void }) {
  const { data, isLoading } = useTranslationHistory({ limit: 20 });
  const { deleteHistory } = useTranslation();

  if (isLoading) {
    return <div className="text-xs text-muted-foreground">Loading history...</div>;
  }

  const history = data?.history ?? [];

  if (history.length === 0) {
    return <div className="text-xs text-muted-foreground italic">No translations yet.</div>;
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
      {history.map((entry) => {
        const srcLang = SUPPORTED_LANGUAGES.find((l) => l.code === entry.sourceLanguage);
        const tgtLang = SUPPORTED_LANGUAGES.find((l) => l.code === entry.targetLanguage);
        return (
          <div
            key={entry.id}
            className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-xs hover:bg-muted transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium">{srcLang?.name ?? entry.sourceLanguage}</span>
                <ArrowLeftRight className="w-2.5 h-2.5 text-muted-foreground" />
                <span className="font-medium text-primary">{tgtLang?.name ?? entry.targetLanguage}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1">{entry.mode}</Badge>
                <QualityBadge score={entry.qualityScore} />
              </div>
              <div className="text-muted-foreground mt-0.5">
                {new Date(entry.createdAt).toLocaleString()} · {entry.inputLength} → {entry.outputLength} chars
              </div>
            </div>
            <button
              className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
              onClick={() => deleteHistory(entry.id)}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Translation Engine Module
// ─────────────────────────────────────────────────────────────────────────────

export default function TranslationEngineModule() {
  const {
    translate,
    isTranslating,
    translationResult,
    translationError,
    detectLanguage,
    isDetecting,
    detectionResult,
    reset,
  } = useTranslation();

  // Source/Target state
  const [sourceContent, setSourceContent] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("es");
  const [mode, setMode] = useState<TranslationMode>("natural");
  const [contentType, setContentType] = useState<ContentType>("script");

  // Preservation flags
  const [preserveBrandNames, setPreserveBrandNames] = useState(true);
  const [preserveFormatting, setPreserveFormatting] = useState(true);
  const [preserveUrls, setPreserveUrls] = useState(true);
  const [preserveNumbers, setPreserveNumbers] = useState(true);

  // UI state
  const [copied, setCopied] = useState(false);
  const [showGlossary, setShowGlossary] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState("translation");

  // Auto-detect
  const debouncedSource = useDebounce(sourceContent, 1500);
  useEffect(() => {
    if (sourceLang === "auto" && debouncedSource.length >= 20) {
      detectLanguage(debouncedSource);
    }
  }, [debouncedSource, sourceLang, detectLanguage]);

  const resolvedSourceLang =
    sourceLang === "auto" && detectionResult
      ? detectionResult.detectedLanguage
      : sourceLang;

  const targetLangDef = SUPPORTED_LANGUAGES.find((l) => l.code === targetLang);
  const isRTL = targetLangDef?.direction === "rtl";

  const handleTranslate = useCallback(async () => {
    if (!sourceContent.trim() || !targetLang) return;
    reset();
    await translate({
      content: sourceContent,
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      mode,
      contentType,
      preserveBrandNames,
      preserveFormatting,
      preserveUrls,
      preserveNumbers,
    });
  }, [
    sourceContent, sourceLang, targetLang, mode, contentType,
    preserveBrandNames, preserveFormatting, preserveUrls, preserveNumbers,
    translate, reset,
  ]);

  const handleCopy = useCallback(async () => {
    if (!translationResult?.translatedContent) return;
    await navigator.clipboard.writeText(translationResult.translatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [translationResult]);

  const handleExport = useCallback(() => {
    if (!translationResult) return;
    const blob = new Blob([translationResult.translatedContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `translation-${targetLang}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [translationResult, targetLang]);

  const swapLanguages = useCallback(() => {
    if (sourceLang === "auto") return;
    const oldSource = sourceLang;
    const oldTarget = targetLang;
    setSourceLang(oldTarget);
    setTargetLang(oldSource);
    if (translationResult) {
      setSourceContent(translationResult.translatedContent);
      reset();
    }
  }, [sourceLang, targetLang, translationResult, reset]);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Languages className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h2 className="font-semibold text-foreground">Translation Engine</h2>
            <p className="text-xs text-muted-foreground">Universal AI Translation & Localization</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="gap-1.5 text-xs"
          >
            <Clock className="w-3.5 h-3.5" />
            History
            {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowGlossary(!showGlossary)}
            className="gap-1.5 text-xs"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Glossary
            {showGlossary ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* History Panel */}
      {showHistory && (
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Translation History
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <HistoryPanel onRestore={({ source, translated }) => {
              setSourceContent(source);
              reset();
            }} />
          </CardContent>
        </Card>
      )}

      {/* Glossary Panel */}
      {showGlossary && (
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-muted-foreground" />
              Locked Terminology
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <GlossaryPanel sourceLang={resolvedSourceLang} targetLang={targetLang} />
          </CardContent>
        </Card>
      )}

      {/* Controls Bar */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Language selectors */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger className="h-8 text-xs w-40 flex-shrink-0">
                  <SelectValue placeholder="Source language">
                    {sourceLang === "auto"
                      ? isDetecting
                        ? "Detecting..."
                        : detectionResult
                        ? `Auto (${detectionResult.languageName})`
                        : "Auto Detect"
                      : SUPPORTED_LANGUAGES.find((l) => l.code === sourceLang)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto Detect</SelectItem>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.name} {l.direction === "rtl" ? "(RTL)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 flex-shrink-0"
                onClick={swapLanguages}
                disabled={sourceLang === "auto"}
                title={sourceLang === "auto" ? "Cannot swap with auto-detect" : "Swap languages"}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </Button>

              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="h-8 text-xs w-40 flex-shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.name} {l.direction === "rtl" ? "(RTL)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mode selector */}
            <Select value={mode} onValueChange={(v) => setMode(v as TranslationMode)}>
              <SelectTrigger className="h-8 text-xs w-36 flex-shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSLATION_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <div>
                      <div className="font-medium">{m.label}</div>
                      <div className="text-xs text-muted-foreground">{m.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Content type */}
            <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)}>
              <SelectTrigger className="h-8 text-xs w-36 flex-shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((ct) => (
                  <SelectItem key={ct.value} value={ct.value}>
                    {ct.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Translate button */}
            <Button
              onClick={handleTranslate}
              disabled={!sourceContent.trim() || !targetLang || isTranslating}
              className="h-8 gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 flex-shrink-0"
            >
              {isTranslating ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Translating...</>
              ) : (
                <><Zap className="w-3.5 h-3.5" />Translate</>
              )}
            </Button>
          </div>

          {/* Preservation flags */}
          <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-border/40">
            {[
              { id: "brands", label: "Brand Names", value: preserveBrandNames, setter: setPreserveBrandNames },
              { id: "format", label: "Formatting", value: preserveFormatting, setter: setPreserveFormatting },
              { id: "urls", label: "URLs", value: preserveUrls, setter: setPreserveUrls },
              { id: "nums", label: "Numbers", value: preserveNumbers, setter: setPreserveNumbers },
            ].map(({ id, label, value, setter }) => (
              <div key={id} className="flex items-center gap-1.5">
                <Switch
                  id={`preserve-${id}`}
                  checked={value}
                  onCheckedChange={setter}
                  className="scale-75"
                />
                <Label htmlFor={`preserve-${id}`} className="text-xs text-muted-foreground cursor-pointer">
                  Preserve {label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Side-by-side editors */}
      <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Source */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm flex flex-col">
          <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Source</CardTitle>
              <div className="flex items-center gap-2">
                {sourceLang === "auto" && detectionResult && (
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {detectionResult.languageName} ({detectionResult.confidence}%)
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {sourceContent.length.toLocaleString()} chars
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 flex-1">
            <PromptEditor
              value={sourceContent}
              onChange={(val) => {
                setSourceContent(val);
                reset();
              }}
              placeholder="Enter content to translate..."
              className="h-full text-sm font-mono leading-relaxed"
              minHeight="300px"
            />
          </CardContent>
        </Card>

        {/* Translation */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm flex flex-col">
          <CardHeader className="pb-2 pt-3 px-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Translation</CardTitle>
              <div className="flex items-center gap-2">
                {translationResult && (
                  <>
                    <QualityBadge score={translationResult.qualityReport.overallScore} />
                    {translationResult.fromCache && (
                      <Badge variant="outline" className="text-[10px] h-5 border-violet-500/30 text-violet-400">
                        Cached
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {translationResult.outputLength.toLocaleString()} chars
                    </span>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3 flex-1 flex flex-col gap-2">
            <div className="relative flex-1">
              <Textarea
                value={translationResult?.translatedContent ?? ""}
                readOnly
                dir={isRTL ? "rtl" : "ltr"}
                placeholder={
                  isTranslating
                    ? "Translating..."
                    : "Translation will appear here..."
                }
                className={`h-full min-h-[300px] resize-none text-sm font-mono leading-relaxed ${
                  isRTL ? "text-right" : "text-left"
                } ${isTranslating ? "opacity-50" : ""}`}
              />
              {isTranslating && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                    Translating with AI...
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {translationResult && (
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-1.5 text-xs h-7"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  className="gap-1.5 text-xs h-7"
                >
                  <Download className="w-3 h-3" />
                  Export
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleTranslate}
                  className="gap-1.5 text-xs h-7 ml-auto"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retranslate
                </Button>
              </div>
            )}

            {/* Error */}
            {translationError && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                {translationError.message}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quality Breakdown */}
      {translationResult && (
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="p-3">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs font-medium text-muted-foreground">Quality Breakdown:</span>
              {[
                { label: "Semantic", score: translationResult.qualityReport.semanticAccuracy },
                { label: "Tone", score: translationResult.qualityReport.tonePreservation },
                { label: "Formatting", score: translationResult.qualityReport.formattingPreservation },
                { label: "Localization", score: translationResult.qualityReport.localizationQuality },
              ].map(({ label, score }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="text-xs text-muted-foreground">{label}:</span>
                  <QualityBadge score={score} />
                </div>
              ))}
              <span className="text-xs text-muted-foreground ml-auto">
                Mode: <span className="capitalize text-foreground">{translationResult.mode}</span>
                {" · "}
                {translationResult.processingTimeMs}ms
                {" · "}
                {translationResult.sourceLanguage} → {translationResult.targetLanguage}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
