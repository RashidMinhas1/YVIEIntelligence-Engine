"use client";

import React, { useState, useRef } from "react";
import { StudioProject, ScriptSection } from "@/lib/types/studio";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { Download, Clock, GripVertical, Image as ImageIcon, Video, Type, ArrowRight, Save, LayoutGrid, LayoutList, Sparkles, Upload, FileText, Wand2, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useJob } from "@/hooks/use-job";
import { splitScriptIntoSentences, splitScriptIntoParagraphs } from "@/lib/utils";

interface StoryboardPanelProps {
  project: StudioProject;
  updateSection: (sectionId: string, updates: Partial<ScriptSection>) => void;
  reorderSections: (startIndex: number, endIndex: number) => void;
  setProject: React.Dispatch<React.SetStateAction<StudioProject>>;
}

// Helper component for AI-assisted fields
const AiSuggestField = ({ 
  label, 
  value, 
  onChange, 
  sectionId, 
  fieldKey, 
  scriptChunk,
  globalTheme
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void; 
  sectionId: string; 
  fieldKey: string;
  scriptChunk: string;
  globalTheme: string;
}) => {
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleSuggest = async () => {
    if (!scriptChunk.trim()) {
      toast.error("Add some script content first before requesting AI suggestions.");
      return;
    }
    setIsSuggesting(true);
    try {
      const res = await fetch("/api/studio/storyboard/suggest-field", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptChunk, fieldToSuggest: fieldKey, globalTheme })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onChange(data.suggestion);
      toast.success(`${label} suggested!`);
    } catch (err: any) {
      toast.error(err.message || "Suggestion failed.");
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
        <button 
          onClick={handleSuggest} 
          disabled={isSuggesting}
          className="text-[10px] font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors disabled:opacity-50"
        >
          {isSuggesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          AI Suggest
        </button>
      </div>
      {fieldKey === "aiPrompt" || fieldKey === "brollSuggestions" || fieldKey === "voiceOver" ? (
        <Textarea 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="text-xs min-h-[60px] resize-y rounded-md" 
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      ) : (
        <Input 
          value={value} 
          onChange={(e) => onChange(e.target.value)} 
          className="text-xs h-8 rounded-md" 
          placeholder={`Enter ${label.toLowerCase()}...`}
        />
      )}
    </div>
  );
};

export function StoryboardPanel({ project, updateSection, reorderSections, setProject }: StoryboardPanelProps) {
  const [viewMode, setViewMode] = useState<"grid" | "timeline">("grid");
  const [wpm, setWpm] = useState<number>(150);
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  
  // Collapsible state for scene fields
  const [expandedScenes, setExpandedScenes] = useState<Record<string, boolean>>({});
  
  // AI Generator State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTheme, setAiTheme] = useState(project.globalVisualStyle || "Documentary Cinematic");
  const [aiSceneCount, setAiSceneCount] = useState<number | "auto">("auto");
  const [aiChunkStyle, setAiChunkStyle] = useState<"sentences" | "paragraphs">("sentences");
  const [aiScript, setAiScript] = useState(project.rawScript || project.sections.map(s => s.content).join("\n\n"));

  React.useEffect(() => {
    const currentText = project.rawScript || project.sections.map(s => s.content).join("\n\n");
    setAiScript(currentText);
  }, [project.rawScript, project.sections]);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    reorderSections(result.source.index, result.destination.index);
  };

  const calculateDuration = (text: string, currentWpm: number) => {
    if (!text) return 0;
    const words = text.trim().split(/\s+/).length;
    return text.trim() === "" ? 0 : Math.ceil((words / currentWpm) * 60);
  };

  const handleContentChange = (sectionId: string, content: string) => {
    const duration = calculateDuration(content, wpm);
    updateSection(sectionId, { content, duration });
  };

  const totalDuration = project.sections.reduce((acc, s) => acc + (s.duration || calculateDuration(s.content, wpm)), 0);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const toggleSceneExpanded = (id: string) => {
    setExpandedScenes(prev => ({ ...prev, [id]: prev[id] === undefined ? false : !prev[id] }));
  };

  const handleExport = async (format: "txt" | "md" | "json" | "docx") => {
    if (format === "json") {
      const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_storyboard.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported as JSON");
      return;
    }

    if (format === "txt" || format === "md") {
      let content = "";
      project.sections.forEach((s, i) => {
        if (format === "txt") {
          content += `==================================================\nSCENE ${String(i + 1).padStart(2, "0")}\n==================================================\n\n`;
          content += `SCRIPT\n${s.content || ""}\n\n`;
          content += `--------------------------------------------------\nVOICE OVER\n--------------------------------------------------\n${s.voiceOver || ""}\n\n`;
          content += `--------------------------------------------------\nVISUALS\n--------------------------------------------------\nEnvironment: ${s.environment || ""}\nBackground: ${s.background || ""}\nCharacters: ${s.characterNotes || ""}\nComposition: ${s.composition || ""}\n\n`;
          content += `--------------------------------------------------\nCAMERA\n--------------------------------------------------\nMovement: ${s.cameraMovement || ""}\nAngle: ${s.cameraAngle || ""}\nLens: ${s.cameraLens || ""}\n\n`;
          content += `--------------------------------------------------\nLIGHTING\n--------------------------------------------------\n${s.lighting || ""}\n\n`;
          content += `--------------------------------------------------\nCOLOR PALETTE\n--------------------------------------------------\n${s.colorPalette || ""}\n\n`;
          content += `--------------------------------------------------\nART DIRECTION\n--------------------------------------------------\nMood: ${s.mood || ""}\nEmotion: ${s.emotion || ""}\n\n`;
          content += `--------------------------------------------------\nB-ROLL\n--------------------------------------------------\n${s.brollSuggestions ? (Array.isArray(s.brollSuggestions) ? s.brollSuggestions.map(b => `- ${b}`).join("\n") : s.brollSuggestions) : ""}\n\n`;
          content += `--------------------------------------------------\nON SCREEN TEXT\n--------------------------------------------------\n${s.onScreenText || ""}\n\n`;
          content += `--------------------------------------------------\nSFX\n--------------------------------------------------\n${s.soundEffects || ""}\n\n`;
          content += `--------------------------------------------------\nBACKGROUND MUSIC\n--------------------------------------------------\n${s.musicNotes || ""}\n\n`;
          content += `--------------------------------------------------\nTRANSITIONS\n--------------------------------------------------\n${s.transitionNotes || ""}\n\n`;
          content += `--------------------------------------------------\nPOST PRODUCTION\n--------------------------------------------------\n${s.editingNotes || ""}\n\n`;
          content += `--------------------------------------------------\nAI IMAGE PROMPT\n--------------------------------------------------\n${s.aiPrompt || ""}\n\n`;
          content += `--------------------------------------------------\nNEGATIVE PROMPT\n--------------------------------------------------\n${s.negativePrompt || ""}\n\n`;
        } else if (format === "md") {
          content += `# SCENE ${String(i + 1).padStart(2, "0")}\n\n`;
          content += `## Script\n${s.content || ""}\n\n`;
          content += `## Voice Over\n${s.voiceOver || ""}\n\n`;
          content += `## Visuals\n- **Environment:** ${s.environment || ""}\n- **Background:** ${s.background || ""}\n- **Characters:** ${s.characterNotes || ""}\n- **Composition:** ${s.composition || ""}\n\n`;
          content += `## Camera\n- **Movement:** ${s.cameraMovement || ""}\n- **Angle:** ${s.cameraAngle || ""}\n- **Lens:** ${s.cameraLens || ""}\n\n`;
          content += `## Lighting\n${s.lighting || ""}\n\n`;
          content += `## Color Palette\n${s.colorPalette || ""}\n\n`;
          content += `## Art Direction\n- **Mood:** ${s.mood || ""}\n- **Emotion:** ${s.emotion || ""}\n\n`;
          content += `## B-Roll\n${s.brollSuggestions ? (Array.isArray(s.brollSuggestions) ? s.brollSuggestions.map(b => `- ${b}`).join("\n") : s.brollSuggestions) : ""}\n\n`;
          content += `## On Screen Text\n${s.onScreenText || ""}\n\n`;
          content += `## SFX\n${s.soundEffects || ""}\n\n`;
          content += `## Background Music\n${s.musicNotes || ""}\n\n`;
          content += `## Transitions\n${s.transitionNotes || ""}\n\n`;
          content += `## Post Production\n${s.editingNotes || ""}\n\n`;
          content += `## AI Image Prompt\n\`\`\`\n${s.aiPrompt || ""}\n\`\`\`\n\n`;
          content += `## Negative Prompt\n\`\`\`\n${s.negativePrompt || ""}\n\`\`\`\n\n`;
        }
      });
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_storyboard.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${format.toUpperCase()}`);
      return;
    }

    if (format === "docx") {
      try {
        const docx = await import("docx");
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } = docx;
        
        const docChildren: any[] = [
          new Paragraph({
            text: project.title || "Storyboard",
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 }
          }),
          new Paragraph({
            text: `Generated on: ${new Date().toLocaleDateString()}`,
            spacing: { after: 800 }
          })
        ];

        project.sections.forEach((s, i) => {
          docChildren.push(
            new Paragraph({ text: `SCENE ${String(i + 1).padStart(2, "0")}`, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } }),
            
            new Paragraph({ text: "Script", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: s.content || "", spacing: { after: 200 } }),
            
            new Paragraph({ text: "Voice Over", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: s.voiceOver || "", spacing: { after: 200 } }),
            
            new Paragraph({ text: "Visuals", heading: HeadingLevel.HEADING_2 }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Environment", style: "Strong" })] }), new TableCell({ children: [new Paragraph(s.environment || "")] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Background", style: "Strong" })] }), new TableCell({ children: [new Paragraph(s.background || "")] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Characters", style: "Strong" })] }), new TableCell({ children: [new Paragraph(s.characterNotes || "")] })] }),
                new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: "Composition", style: "Strong" })] }), new TableCell({ children: [new Paragraph(s.composition || "")] })] })
              ]
            }),
            new Paragraph({ spacing: { after: 200 } }),

            new Paragraph({ text: "Camera", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ children: [new TextRun({ text: "Movement: ", bold: true }), new TextRun(s.cameraMovement || "")] }),
            new Paragraph({ children: [new TextRun({ text: "Angle: ", bold: true }), new TextRun(s.cameraAngle || "")] }),
            new Paragraph({ children: [new TextRun({ text: "Lens: ", bold: true }), new TextRun(s.cameraLens || "")], spacing: { after: 200 } }),
            
            new Paragraph({ text: "Lighting", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: s.lighting || "", spacing: { after: 200 } }),
            
            new Paragraph({ text: "Color Palette", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: s.colorPalette || "", spacing: { after: 200 } }),
            
            new Paragraph({ text: "Art Direction", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ children: [new TextRun({ text: "Mood: ", bold: true }), new TextRun(s.mood || "")] }),
            new Paragraph({ children: [new TextRun({ text: "Emotion: ", bold: true }), new TextRun(s.emotion || "")], spacing: { after: 200 } }),
            
            new Paragraph({ text: "B-Roll", heading: HeadingLevel.HEADING_2 })
          );

          if (s.brollSuggestions && Array.isArray(s.brollSuggestions)) {
            s.brollSuggestions.forEach(b => {
              docChildren.push(new Paragraph({ text: b, bullet: { level: 0 } }));
            });
          } else if (s.brollSuggestions) {
            docChildren.push(new Paragraph({ text: String(s.brollSuggestions) }));
          }
          docChildren.push(new Paragraph({ spacing: { after: 200 } }));

          docChildren.push(
            new Paragraph({ text: "On Screen Text", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: s.onScreenText || "", spacing: { after: 200 } }),
            
            new Paragraph({ text: "Music & Sound Effects", heading: HeadingLevel.HEADING_2 })
          );
          if (s.musicNotes) docChildren.push(new Paragraph({ text: `Music: ${s.musicNotes}`, bullet: { level: 0 } }));
          if (s.soundEffects) docChildren.push(new Paragraph({ text: `SFX: ${s.soundEffects}`, bullet: { level: 0 } }));
          docChildren.push(new Paragraph({ spacing: { after: 200 } }));

          docChildren.push(
            new Paragraph({ text: "Transitions", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: s.transitionNotes || "", bullet: { level: 0 } }),
            new Paragraph({ spacing: { after: 200 } }),
            
            new Paragraph({ text: "Post Production", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: s.editingNotes || "", spacing: { after: 200 } }),
            
            new Paragraph({ text: "AI Image Prompt", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ children: [new TextRun({ text: s.aiPrompt || "", font: "Courier New" })], spacing: { after: 200 } }),
            
            new Paragraph({ text: "Negative Prompt", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ children: [new TextRun({ text: s.negativePrompt || "", font: "Courier New" })], spacing: { after: 400 } })
          );
        });

        const doc = new Document({
          sections: [{
            properties: {},
            children: docChildren
          }]
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${project.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_storyboard.docx`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Exported as DOCX");
      } catch(err) {
        toast.error("Failed to export DOCX");
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/studio/storyboard/extract", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setAiScript(data.text);

      const sentences = splitScriptIntoSentences(data.text);
      
      setProject(prev => {
        const sections = sentences.length > 0 ? sentences.map((sentence, idx) => ({
          id: crypto.randomUUID(),
          type: `Scene ${idx + 1}`,
          content: sentence,
          isExpanded: true
        })) : prev.sections;
        return { ...prev, rawScript: data.text, sections };
      });

      toast.success(sentences.length > 0 ? `Script extracted and split into ${sentences.length} scenes!` : "Script extracted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to extract script from file.");
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const generateAIStoryboard = async () => {
    if (!aiScript.trim()) {
      toast.error("Please provide a script to generate scenes from.");
      return;
    }
    setIsGenerating(true);
    try {
      const chunks = aiChunkStyle === "paragraphs" ? splitScriptIntoParagraphs(aiScript) : splitScriptIntoSentences(aiScript);

      const res = await fetch("/api/studio/generate-storyboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ script: chunks, theme: aiTheme, sceneCount: chunks.length }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate storyboard");

      let phaseCounts: Record<string, number> = {};
      const newSections: ScriptSection[] = [];

      chunks.forEach((chunk, chunkIdx) => {
        // Direct 1-to-1 mapping. Fallback to the last scene if AI truncated the array.
        const scene = data.scenes[Math.min(chunkIdx, data.scenes.length - 1)] || data.scenes[data.scenes.length - 1] || {};

        let guaranteedVoiceOver = scene.voiceOver;
        if (!guaranteedVoiceOver || guaranteedVoiceOver.trim() === "") {
          guaranteedVoiceOver = "Standard documentary tone, engaging and clear pacing.";
        }

        const percent = chunkIdx / chunks.length;
        let phase = "MAIN BODY";
        if (percent < 0.15) phase = "HOOK";
        else if (percent < 0.25) phase = "INTRO";
        else if (percent > 0.90) phase = "CTA";
        else if (percent > 0.75) phase = "CLIMAX";

        phaseCounts[phase] = (phaseCounts[phase] || 0) + 1;
        const styleLabel = aiChunkStyle === "sentences" ? "SENTENCE" : "DIALOGUE";
        const sectionType = `${phase}-${styleLabel}-${phaseCounts[phase]}`;

        newSections.push({
          id: crypto.randomUUID(),
          type: sectionType,
          isExpanded: true,
          ...scene,
          content: chunk,
          voiceOver: guaranteedVoiceOver,
          brollSuggestions: Array.isArray(scene.brollSuggestions) ? scene.brollSuggestions : [scene.brollSuggestions]
        });
      });

      setProject(prev => ({
        ...prev,
        globalVisualStyle: aiTheme,
        sections: newSections,
        updatedAt: new Date().toISOString()
      }));
      
      toast.success("Intelligent Storyboard Generated!");
      setMode("manual");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  const globalTheme = project.globalVisualStyle || "Standard YouTube Video";

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-card flex-wrap gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex bg-muted p-1 rounded-xl shadow-inner">
            <button 
              onClick={() => setMode("manual")} 
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${mode === "manual" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Manual Storyboard
            </button>
            <button 
              onClick={() => setMode("ai")} 
              className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center ${mode === "ai" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Sparkles className="w-4 h-4 mr-2 text-primary"/> AI Generator
            </button>
          </div>
        </div>

        {mode === "manual" && (
          <div className="flex items-center gap-6">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" /> Total: <span className="text-foreground">{formatTime(totalDuration)}</span>
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Pacing:</span>
              <select 
                className="text-sm border rounded-md p-1.5 bg-background font-medium"
                value={wpm}
                onChange={(e) => setWpm(Number(e.target.value))}
              >
                <option value={120}>Slow (120 WPM)</option>
                <option value={150}>Normal (150 WPM)</option>
                <option value={180}>Fast (180 WPM)</option>
              </select>
            </div>
            <div className="flex gap-1 bg-muted p-1 rounded-lg">
              <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="h-8 w-8 p-0 rounded-md">
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === "timeline" ? "secondary" : "ghost"} size="sm" onClick={() => setViewMode("timeline")} className="h-8 w-8 p-0 rounded-md">
                <LayoutList className="w-4 h-4" />
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 ml-2">
                  <Download className="w-4 h-4" /> Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport("txt")}>Plain Text (.txt)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("md")}>Markdown (.md)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("docx")}>Microsoft Word (.docx)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("json")}>JSON Data</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Main Area */}
      <ScrollArea className="flex-1 p-4 md:p-8 bg-muted/10">
        {mode === "ai" ? (
          <div className="max-w-4xl mx-auto bg-card border border-border/60 rounded-2xl p-8 shadow-sm space-y-8">
            <div>
              <h3 className="text-2xl font-bold mb-2">Intelligent Storyboard Generator</h3>
              <p className="text-base text-muted-foreground">Automatically break down your script into professional scenes with 27 points of AI-generated production data, perfect pacing, and Midjourney image prompts.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Global Visual Theme</label>
                <Input 
                  value={aiTheme} 
                  onChange={(e) => setAiTheme(e.target.value)} 
                  placeholder="e.g., Documentary Cinematic, Dark Mystery, Pixar..."
                  className="h-10 text-base"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold">Scene Distribution</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={aiSceneCount.toString()}
                  onChange={(e) => setAiSceneCount(e.target.value === "auto" ? "auto" : Number(e.target.value))}
                >
                  <option value="auto">Automatic (Intelligent Flow Detection)</option>
                  <option value="10">10 Scenes</option>
                  <option value="20">20 Scenes</option>
                  <option value="30">30 Scenes</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 border-t border-border/40 pt-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold">Script Source</label>
                <div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".txt,.md,.pdf,.docx"
                    onChange={handleFileUpload}
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="rounded-full px-4"
                  >
                    {isExtracting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Upload File (PDF, DOCX, TXT)
                  </Button>
                </div>
              </div>
              <Textarea 
                value={aiScript}
                onChange={(e) => {
                  const val = e.target.value;
                  const isPaste = val.length - aiScript.length > 50; // simple heuristic for paste
                  setAiScript(val);

                  if (isPaste) {
                    const sentences = splitScriptIntoSentences(val);
                    if (sentences.length > 0) {
                      setProject(prev => {
                        let localPhaseCounts: Record<string, number> = {};
                        const newSections = sentences.map((sentence, idx) => {
                          const percent = idx / sentences.length;
                          let phase = "MAIN BODY";
                          if (percent < 0.15) phase = "HOOK";
                          else if (percent < 0.25) phase = "INTRO";
                          else if (percent > 0.90) phase = "CTA";
                          else if (percent > 0.75) phase = "CLIMAX";

                          localPhaseCounts[phase] = (localPhaseCounts[phase] || 0) + 1;
                          
                          return {
                            id: crypto.randomUUID(),
                            type: `${phase}-SENTENCE-${localPhaseCounts[phase]}`,
                            content: sentence,
                            isExpanded: true
                          };
                        });
                        return { ...prev, rawScript: val, sections: newSections };
                      });
                      toast.success(`Auto-split into ${sentences.length} scenes!`);
                      return;
                    }
                  }

                  setProject(prev => ({ ...prev, rawScript: val }));
                }}
                className="min-h-[300px] text-base leading-relaxed p-4"
                placeholder="Paste your voiceover script here, or upload a file..."
              />
            </div>

            {/* Chunking Strategy Selector */}
            <div className="space-y-3 pt-6 border-t border-border/40">
              <label className="text-sm font-semibold">How should the AI chunk your script?</label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${aiChunkStyle === "sentences" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30 bg-card"}`}
                  onClick={() => setAiChunkStyle("sentences")}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${aiChunkStyle === "sentences" ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                      {aiChunkStyle === "sentences" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <h4 className="font-bold text-sm">Sentences Form</h4>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">Breaks script line-by-line. Best for fast-paced edits and heavy B-Roll.</p>
                </div>
                <div 
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${aiChunkStyle === "paragraphs" ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30 bg-card"}`}
                  onClick={() => setAiChunkStyle("paragraphs")}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${aiChunkStyle === "paragraphs" ? "border-primary bg-primary" : "border-muted-foreground"}`}>
                      {aiChunkStyle === "paragraphs" && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                    <h4 className="font-bold text-sm">Dialogue / Scenes Form</h4>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">Groups text into natural dialogues. Best for smooth cinematic flow.</p>
                </div>
              </div>
            </div>

            <Button 
              className="w-full h-14 text-lg font-bold rounded-xl" 
              onClick={generateAIStoryboard} 
              disabled={isGenerating || !aiScript.trim()}
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 mr-3 animate-spin" /> Analyzing Narrative & Generating Scenes...</>
              ) : (
                <><Wand2 className="w-5 h-5 mr-3" /> Generate Premium Storyboard</>
              )}
            </Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="storyboard" direction={viewMode === "grid" ? "horizontal" : "vertical"}>
              {(provided: any) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className={viewMode === "grid" ? "grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6" : "flex flex-col gap-6 max-w-5xl mx-auto"}
                >
                  {project.sections.map((section, index) => {
                    const isExpanded = expandedScenes[section.id] !== false; // true by default
                    
                    return (
                      <Draggable key={section.id} draggableId={section.id} index={index}>
                        {(provided: any) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className="bg-card border border-border/60 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col group"
                          >
                            {/* Scene Header */}
                            <div className="p-3 border-b border-border/40 bg-muted/10 flex justify-between items-center rounded-t-xl">
                              <div className="flex items-center gap-3">
                                <div {...provided.dragHandleProps} className="text-muted-foreground hover:text-foreground cursor-grab p-1">
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-bold px-2.5 py-1 bg-primary/10 text-primary rounded-md uppercase tracking-wider">Scene {index + 1}</span>
                                <span className="text-sm text-muted-foreground font-mono font-medium">{formatTime(section.duration || calculateDuration(section.content, wpm))}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-muted-foreground hover:text-foreground"
                                onClick={() => toggleSceneExpanded(section.id)}
                              >
                                {isExpanded ? "Collapse" : "Expand"}
                              </Button>
                            </div>

                            <div className={`flex-1 flex flex-col custom-scrollbar overflow-y-auto transition-all ${isExpanded ? "p-5 space-y-6 max-h-[800px]" : "h-0 p-0 overflow-hidden"}`}>
                              
                              {/* Core Narrative */}
                              <div className="space-y-4 bg-muted/5 p-4 rounded-lg border border-border/30">
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <Input 
                                      value={section.title || ""}
                                      onChange={(e) => updateSection(section.id, { title: e.target.value })}
                                      className="text-base font-bold h-10 bg-transparent border-border/50 focus:bg-background"
                                      placeholder="Scene Title..."
                                    />
                                  </div>
                                  <AiSuggestField 
                                    label="Scene Goal" 
                                    fieldKey="sceneGoal"
                                    value={section.sceneGoal || ""} 
                                    onChange={(v) => updateSection(section.id, { sceneGoal: v })} 
                                    sectionId={section.id} 
                                    scriptChunk={section.content}
                                    globalTheme={globalTheme}
                                  />
                                </div>

                                <div>
                                  <label className="text-xs font-bold text-foreground flex items-center mb-2"><Type className="w-3.5 h-3.5 mr-1.5 text-primary"/> Script Chunk / Dialogue</label>
                                  <Textarea 
                                    value={section.content}
                                    onChange={(e) => handleContentChange(section.id, e.target.value)}
                                    className="text-sm min-h-[100px] resize-y rounded-md bg-background border-border/50 focus:border-primary/50"
                                    placeholder="Voiceover script content..."
                                  />
                                </div>

                                <AiSuggestField 
                                  label="Voice Over Notes (Tone, Pace, Emotion)" 
                                  fieldKey="voiceOver"
                                  value={section.voiceOver || ""} 
                                  onChange={(v) => updateSection(section.id, { voiceOver: v })} 
                                  sectionId={section.id} 
                                  scriptChunk={section.content}
                                  globalTheme={globalTheme}
                                />
                              </div>

                              {/* Visuals & Camera */}
                              <div className="space-y-4">
                                <h4 className="text-xs font-bold text-foreground border-b pb-1 uppercase tracking-wider flex items-center"><Video className="w-3.5 h-3.5 mr-1.5 text-primary"/> Visuals & Camera</h4>
                                
                                <AiSuggestField 
                                  label="Visual Description" 
                                  fieldKey="visualNotes"
                                  value={section.visualNotes || ""} 
                                  onChange={(v) => updateSection(section.id, { visualNotes: v })} 
                                  sectionId={section.id} 
                                  scriptChunk={section.content}
                                  globalTheme={globalTheme}
                                />
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <AiSuggestField label="Camera Angle" fieldKey="cameraAngle" value={section.cameraAngle || ""} onChange={(v) => updateSection(section.id, { cameraAngle: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                  <AiSuggestField label="Camera Lens" fieldKey="cameraLens" value={section.cameraLens || ""} onChange={(v) => updateSection(section.id, { cameraLens: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                  <AiSuggestField label="Camera Movement" fieldKey="cameraMovement" value={section.cameraMovement || ""} onChange={(v) => updateSection(section.id, { cameraMovement: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                  <AiSuggestField label="Composition" fieldKey="composition" value={section.composition || ""} onChange={(v) => updateSection(section.id, { composition: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                </div>
                              </div>

                              {/* Art Direction */}
                              <div className="space-y-4">
                                <h4 className="text-xs font-bold text-foreground border-b pb-1 uppercase tracking-wider flex items-center"><Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary"/> Art Direction</h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <AiSuggestField label="Lighting" fieldKey="lighting" value={section.lighting || ""} onChange={(v) => updateSection(section.id, { lighting: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                  <AiSuggestField label="Color Palette" fieldKey="colorPalette" value={section.colorPalette || ""} onChange={(v) => updateSection(section.id, { colorPalette: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                  <AiSuggestField label="Mood" fieldKey="mood" value={section.mood || ""} onChange={(v) => updateSection(section.id, { mood: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                  <AiSuggestField label="Emotion" fieldKey="emotion" value={section.emotion || ""} onChange={(v) => updateSection(section.id, { emotion: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                  <AiSuggestField label="Environment" fieldKey="environment" value={section.environment || ""} onChange={(v) => updateSection(section.id, { environment: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                  <AiSuggestField label="Background" fieldKey="background" value={section.background || ""} onChange={(v) => updateSection(section.id, { background: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                </div>
                                <AiSuggestField label="Character Notes" fieldKey="characterNotes" value={section.characterNotes || ""} onChange={(v) => updateSection(section.id, { characterNotes: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                              </div>

                              {/* Post Production */}
                              <div className="space-y-4">
                                <h4 className="text-xs font-bold text-foreground border-b pb-1 uppercase tracking-wider flex items-center"><LayoutList className="w-3.5 h-3.5 mr-1.5 text-primary"/> Post Production</h4>
                                
                                <AiSuggestField label="B-Roll Suggestions" fieldKey="brollSuggestions" value={(section.brollSuggestions || []).join("\n") || section.brollNotes || ""} onChange={(v) => updateSection(section.id, { brollSuggestions: v.split("\n") })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  <AiSuggestField label="On Screen Text" fieldKey="onScreenText" value={section.onScreenText || ""} onChange={(v) => updateSection(section.id, { onScreenText: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                  <AiSuggestField label="Subtitle Style" fieldKey="subtitleStyle" value={section.subtitleStyle || ""} onChange={(v) => updateSection(section.id, { subtitleStyle: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                  <AiSuggestField label="Motion Graphics" fieldKey="motionGraphics" value={section.motionGraphics || ""} onChange={(v) => updateSection(section.id, { motionGraphics: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                  <AiSuggestField label="Zoom Effect" fieldKey="zoomSuggestions" value={section.zoomSuggestions || ""} onChange={(v) => updateSection(section.id, { zoomSuggestions: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                  <AiSuggestField label="Transition" fieldKey="transitionSuggestions" value={section.transitionSuggestions || section.transitionNotes || ""} onChange={(v) => updateSection(section.id, { transitionSuggestions: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                  <AiSuggestField label="Editing Notes" fieldKey="editingNotes" value={section.editingNotes || ""} onChange={(v) => updateSection(section.id, { editingNotes: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                  <AiSuggestField label="Sound Effects" fieldKey="soundEffects" value={section.soundEffects || ""} onChange={(v) => updateSection(section.id, { soundEffects: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                  <AiSuggestField label="Background Music" fieldKey="musicNotes" value={section.musicNotes || ""} onChange={(v) => updateSection(section.id, { musicNotes: v })} sectionId={section.id} scriptChunk={section.content} globalTheme={globalTheme}/>
                                </div>
                              </div>

                              {/* AI Image Generation */}
                              <div className="space-y-4 bg-primary/5 p-4 rounded-lg border border-primary/20">
                                <h4 className="text-xs font-bold text-primary border-b border-primary/20 pb-1 uppercase tracking-wider flex items-center"><ImageIcon className="w-3.5 h-3.5 mr-1.5"/> AI Image Prompts</h4>
                                
                                <AiSuggestField 
                                  label="Professional Image Prompt (Midjourney / FLUX)" 
                                  fieldKey="aiPrompt"
                                  value={section.aiPrompt || ""} 
                                  onChange={(v) => updateSection(section.id, { aiPrompt: v })} 
                                  sectionId={section.id} 
                                  scriptChunk={section.content}
                                  globalTheme={globalTheme}
                                />
                                
                                <AiSuggestField 
                                  label="Negative Prompt" 
                                  fieldKey="negativePrompt"
                                  value={section.negativePrompt || ""} 
                                  onChange={(v) => updateSection(section.id, { negativePrompt: v })} 
                                  sectionId={section.id} 
                                  scriptChunk={section.content}
                                  globalTheme={globalTheme}
                                />
                                
                                <AiSuggestField 
                                  label="Thumbnail Consistency Note" 
                                  fieldKey="thumbnailConsistency"
                                  value={section.thumbnailConsistency || ""} 
                                  onChange={(v) => updateSection(section.id, { thumbnailConsistency: v })} 
                                  sectionId={section.id} 
                                  scriptChunk={section.content}
                                  globalTheme={globalTheme}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </ScrollArea>
    </div>
  );
}
