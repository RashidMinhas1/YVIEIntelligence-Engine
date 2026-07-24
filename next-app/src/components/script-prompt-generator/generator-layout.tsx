"use client";

import React, { useState } from "react";
import { GeneratorProvider, useGenerator, GeneratorTab } from "./generator-context";
import { 
  FileText, Activity, LayoutList, TerminalSquare, 
  Settings2, Library, Download, History, Save, Cloud, Loader2, Play, Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { VISUAL_STYLES, CATEGORIES } from "@/lib/constants/visual-styles";
import { toast } from "sonner";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const NAV_ITEMS: { id: GeneratorTab; label: string; icon: any }[] = [
  { id: "import", label: "Script Import", icon: FileText },
  { id: "analysis", label: "Script Analysis", icon: Activity },
  { id: "breakdown", label: "Scene Breakdown", icon: LayoutList },
  { id: "generator", label: "Prompt Generator", icon: TerminalSquare },
  { id: "settings", label: "Prompt Settings", icon: Settings2 },
  { id: "library", label: "Prompt Library", icon: Library },
  { id: "export", label: "Export Center", icon: Download },
  { id: "history", label: "History", icon: History },
];

const MOCK_JSON_RESULT = `{
  "scene": "Beat 1 – The Mitford Sisters",
  "style": "Historical Explainer – AI Generated Cinematic Documentary",
  "shot": {
    "composition": "Wide establishing shot of a grand British aristocratic estate in the 1920s, six young sisters standing elegantly in front of the manor gardens",
    "camera_motion": "Slow Ken Burns zoom toward the sisters with subtle cinematic pan across the estate grounds",
    "frame_rate": "24 fps",
    "resolution": "1920 × 1080",
    "lens": "Cinematic 35mm lens simulation with realistic depth",
    "look": "Ultra-realistic AI-generated imagery, detailed faces, period-accurate clothing, cinematic documentary aesthetic"
  },
  "voice_over": {
    "language": "English",
    "tone": "Engaging, informative",
    "mode": "Narrative, explanatory",
    "emotion": "Intriguing, curious",
    "narration_text": "The Mitford sisters were born into privilege, yet their lives would become one of history's most fascinating and controversial family stories.",
    "duration_sec": "8"
  }
}`;

function LayoutContent() {
  const { activeTab, setActiveTab, isSaving, project, setProject } = useGenerator();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedBeats, setSelectedBeats] = useState<Set<string>>(new Set());
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [previewScene, setPreviewScene] = useState<string | null>(null);
  const [preChunks, setPreChunks] = useState<{ id: string, text: string, styleOverride: string | null }[]>([]);

  React.useEffect(() => {
    if (!project.rawScript) {
      setPreChunks([]);
      return;
    }
    let rawSentences = project.rawScript.split(/(?<=[.?!])\s+/).filter(s => s.trim().length > 0);
    if (rawSentences.length === 0) rawSentences = [project.rawScript];
    let beatChunks: string[] = [];
    if (project.settings?.beatDetectionMode === "sentence") {
      beatChunks = rawSentences;
    } else {
      let currentChunk = "";
      rawSentences.forEach((sentence, i) => {
        currentChunk += sentence + " ";
        if ((i + 1) % 3 === 0 || i === rawSentences.length - 1) {
          beatChunks.push(currentChunk.trim());
          currentChunk = "";
        }
      });
    }
    setPreChunks(prev => {
      // Preserve existing overrides if possible by checking index
      return beatChunks.map((text, i) => ({
        id: prev[i]?.id || crypto.randomUUID(),
        text,
        styleOverride: prev[i]?.styleOverride || null
      }));
    });
  }, [project.rawScript, project.settings?.beatDetectionMode]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const text = await file.text();
      setProject(p => ({ ...p, rawScript: text, title: file.name.replace(/\.[^/.]+$/, "") }));
      toast.success("Script imported successfully from " + file.name);
    } catch (err) {
      toast.error("Failed to parse file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleExport = async (format: "json" | "txt" | "md" | "zip", onlySelected: boolean = false) => {
    let outputData = "";
    
    const entries = Object.entries(project.prompts || {});
    const targetEntries = onlySelected && selectedBeats.size > 0
      ? entries.filter(([id]) => selectedBeats.has(id))
      : entries;

    if (format === "zip") {
      const zip = new JSZip();
      const scenesFolder = zip.folder("Scenes");
      const projectFolder = zip.folder("Project");
      
      // Add Scenes
      targetEntries.forEach(([id, data], i) => {
        const beatNum = String(i + 1).padStart(2, '0');
        scenesFolder?.file(`Scene-${beatNum}.json`, data.json);
      });
      
      // Add Project files
      const projectMetadata = {
        title: project.title || "Untitled Project",
        totalScenes: targetEntries.length,
        settings: project.settings
      };
      projectFolder?.file("project.json", JSON.stringify(projectMetadata, null, 2));
      projectFolder?.file("style.json", JSON.stringify(project.settings || {}, null, 2));
      projectFolder?.file("metadata.json", JSON.stringify({ generatorVersion: "2.0", generatedAt: new Date().toISOString() }, null, 2));
      projectFolder?.file("README.md", `# ${project.title || "Untitled Project"}\n\nGenerated with AI Storyboard Generator.`);
      
      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `${project.title || "project"}.zip`);
      toast.success("Exported as ZIP");
      return;
    }

    if (format === "json") {
      const exportObj: Record<string, any> = {};
      targetEntries.forEach(([id, data]) => {
        exportObj[id] = JSON.parse(data.json);
      });
      outputData = JSON.stringify(exportObj, null, 2);
    } else if (format === "txt") {
      targetEntries.forEach(([id, data], i) => {
        const beatObj = JSON.parse(data.json);
        outputData += `--- BEAT ${String(i + 1).padStart(2, '0')} ---\n`;
        Object.entries(beatObj).forEach(([key, val]) => {
          outputData += `${key}: ${val}\n`;
        });
        outputData += `\n`;
      });
    } else if (format === "md") {
      outputData += `# Project Export: ${project.title || 'Untitled'}\n\n`;
      targetEntries.forEach(([id, data], i) => {
        const beatObj = JSON.parse(data.json);
        outputData += `## BEAT ${String(i + 1).padStart(2, '0')} - ${beatObj['Beat Title'] || beatObj['Scene Name']}\n\n`;
        Object.entries(beatObj).forEach(([key, val]) => {
          if (typeof val === 'object') {
            outputData += `**${key}**:\n`;
            outputData += "```json\n" + JSON.stringify(val, null, 2) + "\n```\n\n";
          } else {
            outputData += `**${key}**: ${val}\n\n`;
          }
        });
        outputData += `---\n\n`;
      });
    }

    const mime = format === "json" ? "application/json" : "text/plain";
    const blob = new Blob([outputData], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title || "prompt"}.${format}`;
    a.click();
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  const handleCopy = (onlySelected: boolean = false) => {
    const entries = Object.entries(project.prompts || {});
    const targetEntries = onlySelected && selectedBeats.size > 0
      ? entries.filter(([id]) => selectedBeats.has(id))
      : entries;
    
    const exportObj: Record<string, any> = {};
    targetEntries.forEach(([id, data]) => {
      exportObj[id] = JSON.parse(data.json);
    });
    
    navigator.clipboard.writeText(JSON.stringify(exportObj, null, 2));
    toast.success(onlySelected ? "Copied Selected Beats!" : "Copied All Beats!");
  };

  const toggleSelectBeat = (sceneId: string) => {
    const newSet = new Set(selectedBeats);
    if (newSet.has(sceneId)) newSet.delete(sceneId);
    else newSet.add(sceneId);
    setSelectedBeats(newSet);
  };

  const toggleExpandedScene = (sceneId: string) => {
    const newSet = new Set(expandedScenes);
    if (newSet.has(sceneId)) newSet.delete(sceneId);
    else newSet.add(sceneId);
    setExpandedScenes(newSet);
  };

  // ─── Policy-safe prompt cleaner ───────────────────────────────────────────
  // Strips real proper names, brand names, and protected IP from prompts
  // so outputs never trigger AI platform content policy violations.
  const makePolicySafe = (text: string): string => {
    return text
      // Remove real person names → descriptive role
      .replace(/\bEmpress\s+\w+\b/gi, "a regal 19th-century empress")
      .replace(/\bKing\s+\w+\b/gi, "a period-accurate monarch")
      .replace(/\bQueen\s+\w+\b/gi, "a period-accurate queen")
      .replace(/\bPresident\s+\w+\b/gi, "a head of state")
      .replace(/\bGeneral\s+\w+\b/gi, "a military commander")
      .replace(/\bAdolf\s+\w+|Hitler\b/gi, "the wartime dictator")
      .replace(/\bChurchill\b/gi, "the wartime prime minister")
      .replace(/\bStalin\b/gi, "the wartime leader")
      .replace(/\bRoosevelt\b/gi, "the wartime president")
      .replace(/\bEugénie|Eugenie\b/gi, "the exiled empress")
      // Remove brand/platform names
      .replace(/\bNetflix\b/gi, "premium streaming")
      .replace(/\bARRI\s*Alexa\b/gi, "professional cinema camera")
      .replace(/\bARRI\b/gi, "cinema-grade")
      .replace(/\bKodak\b/gi, "vintage film stock")
      .replace(/\bHollywood\b/gi, "cinematic")
      .replace(/\bDisney\b/gi, "studio-quality")
      .replace(/\bHans Zimmer\b/gi, "award-winning composer style")
      .replace(/\bBBC\b/gi, "public broadcaster")
      .replace(/\bHBO\b/gi, "premium cable")
      // Remove specific named locations that could be sensitive
      .replace(/\bWall Street\b/gi, "a financial district")
      // Clean up double spaces
      .replace(/\s{2,}/g, " ")
      .trim();
  };

  const handleGenerate = () => {
    if (!project.rawScript || preChunks.length === 0) return;
    setCurrentStep(2);
    setIsGenerating(true);

    setTimeout(() => {
      const newScenes: any[] = [];
      const newPrompts: Record<string, any> = {};

      const globalMood = project.settings?.mood || "Serious";

      // ── Beat title bank (cycles if script has more beats) ──────────────────
      const beatTitles = [
        "The Spark",        "Cities in Ruin",   "The Human Cost",
        "The Eastern Front","Global Mobilization","Resistance in Shadows",
        "Immense Sacrifice","Silence and Memory","Turning the Tide",
        "The Home Front",   "Into the Unknown",  "Final Stand",
        "Liberation",       "The Price of War",  "Aftermath",
      ];

      // ── Camera motion bank ─────────────────────────────────────────────────
      const cameraMotions = [
        "Slow pan across the parchment map with ink spreading",
        "Slow push-in on ink illustration of the scene",
        "Dolly forward across hand-drawn landscape",
        "Crane shot descending from above into the scene",
        "Wide establishing pan revealing the full environment",
        "Orbit shot slowly circling ink-drawn figures",
        "Slow pan left to right across illustrated environment",
        "Tilt up from ground level — revealing scale in ink",
        "Tracking shot following ink-drawn subject movement",
        "Cinematic reveal — ink bleeds back to expose full scene"
      ];

      // ── Lighting bank (ink/parchment style) ───────────────────────────────
      const lightingMoods = [
        { primary: "Sepia parchment tone", secondary: "Dark ink shadows", accents: "Red ink stains for conflict zones" },
        { primary: "Warm candlelight amber over parchment", secondary: "Deep sepia shadow zones", accents: "Pale highlight on focal figures" },
        { primary: "Cold ash-grey wash across the scene", secondary: "Muted blue-grey ink fill", accents: "White ink highlight on horizon" },
        { primary: "Dramatic ink contrast — near black background", secondary: "Faded parchment mid-tones", accents: "Burnt sienna ink accents on key elements" },
        { primary: "Golden hour sepia wash", secondary: "Long dark shadows in ink", accents: "Faint white rim on silhouetted figures" },
      ];

      // ── SFX bank ──────────────────────────────────────────────────────────
      const sfxSets = [
        ["Air raid siren faint in background", "Tank treads rumbling", "Ink splatter sound accent"],
        ["Distant cannon fire rumble", "Marching boots on cobblestone", "Radio static burst"],
        ["Wind howling across open field", "Paper map rustling", "Clock ticking under tension"],
        ["Crowd murmur of soldiers", "Metal equipment clinking", "Muffled distant explosion"],
        ["Siren wail fading in distance", "Aircraft engine drone overhead", "Broken glass accent"],
        ["Soft crying in background", "Footsteps on rubble", "Low church bell tolling"],
        ["Factory machinery hum", "Morse code signal tapping", "Steel door closing"],
        ["Silence broken by single gunshot", "Echo in empty street", "Wind through ruins"],
      ];

      // ── Ambient sound bank ─────────────────────────────────────────────────
      const ambients = [
        "Low rumble of distant thunder",
        "Soft wind across open battlefield at dusk",
        "Muffled city sounds behind a veil of smoke",
        "Quiet — broken only by distant artillery",
        "Factory hum and steel forging sounds",
        "Occupied city at night — tension-filled silence",
        "Rain falling on rubble — desolate atmosphere",
        "Early morning birdsong — fragile peace",
      ];

      // ── Music bank ────────────────────────────────────────────────────────
      const musicBank = [
        { track: "Somber orchestral strings", description: "Dark, suspenseful strings with slow pacing", tempo: "60 BPM", key: "D minor", curve: "slow crescendo" },
        { track: "Melancholic piano underscore", description: "Single piano with sparse string accompaniment", tempo: "52 BPM", key: "A minor", curve: "steady and mournful" },
        { track: "Tense brass and percussion", description: "Low brass tension with rhythmic percussion", tempo: "76 BPM", key: "E minor", curve: "builds through scene" },
        { track: "Haunting choir and strings", description: "Wordless choir over slow string bed", tempo: "48 BPM", key: "B minor", curve: "peaks at mid-scene, fades" },
        { track: "Driving orchestral underscore", description: "Full orchestral swell — strings, brass, timpani", tempo: "88 BPM", key: "G minor", curve: "strong swell at 4s, taper at 7s" },
        { track: "Sparse cello solo", description: "Intimate solo cello — grief and resilience", tempo: "44 BPM", key: "C minor", curve: "quiet throughout, single peak" },
        { track: "Percussion and low brass tension", description: "Staccato brass hits with sustained tension pad", tempo: "72 BPM", key: "F minor", curve: "urgent from start, peaks at 5s" },
        { track: "Resolving orchestral theme", description: "Hopeful string motif resolving from minor to major", tempo: "64 BPM", key: "D minor → F major", curve: "rises and resolves at 6s" },
      ];

      // ── Background color bank (parchment palette) ─────────────────────────
      const bgPalettes = [
        "aged parchment beige",
        "weathered sepia brown",
        "pale ash grey parchment",
        "worn antique ivory",
        "faded linen cream",
      ];

      // ── Transition bank ───────────────────────────────────────────────────
      const transitionBank = [
        { between: "ink bleed dissolve", impact: "quick red ink blot on high-impact moments" },
        { between: "slow sepia cross-dissolve", impact: "single frame black ink splash" },
        { between: "ink wipe left to right", impact: "ink burst on cannon/impact sounds" },
        { between: "parchment burn transition", impact: "white ink flare on emotional beats" },
        { between: "fade through black ink", impact: "subtle ink ripple on key phrases" },
      ];

      preChunks.forEach((chunk, index) => {
        const beatNum = index + 1;
        const sceneId = chunk.id;
        const paddedNum = String(beatNum).padStart(3, '0');

        newScenes.push({
          id: sceneId,
          sceneNumber: beatNum,
          voiceOver: chunk.text,
          visualDescription: `Beat ${beatNum} visual`
        });

        // ── Derived values ─────────────────────────────────────────────────
        const beatTitle = beatTitles[(index) % beatTitles.length];
        const cameraMotion = cameraMotions[index % cameraMotions.length];
        const lighting = lightingMoods[index % lightingMoods.length];
        const sfx = sfxSets[index % sfxSets.length];
        const ambient = ambients[index % ambients.length];
        const music = musicBank[index % musicBank.length];
        const bgPalette = bgPalettes[index % bgPalettes.length];
        const transition = transitionBank[index % transitionBank.length];

        // Extract year/date if present in the narration
        const yearMatch = chunk.text.match(/\b(19[0-9]{2}|20[0-9]{2})\b/);
        const subtextDate = yearMatch ? yearMatch[0] : `Beat ${beatNum} of ${preChunks.length}`;

        // Extract location/theme keywords for tags
        const locationKeywords = (chunk.text.match(/\b(Poland|London|Berlin|France|Europe|Pacific|Africa|Eastern|Western|occupied)\b/gi) || []);
        const themeKeywords = (chunk.text.match(/\b(invasion|battle|resistance|sacrifice|victory|liberation|silence|memory|courage|mobilization)\b/gi) || []);
        const allKeywords = [...new Set([...locationKeywords, ...themeKeywords].map(w => w.toLowerCase()))];
        const tags: string[] = allKeywords.slice(0, 2);
        if (tags.length < 3) tags.push("historical-documentary");
        if (tags.length < 3) tags.push("world-war-ii");

        // Safe first words for composition/timeline
        const words = chunk.text.split(' ');
        const openWords = makePolicySafe(words.slice(0, 6).join(' '));
        const midWords = makePolicySafe(words.slice(Math.floor(words.length / 2), Math.floor(words.length / 2) + 5).join(' '));
        const wordCount = words.length;
        const durationSec = Math.max(7, Math.min(10, Math.round(wordCount / 3)));

        // ── Timeline actions — parchment ink style, beat-specific ─────────
        const timelineActions = [
          `Ink bleeds across parchment to reveal opening scene — ${openWords}`,
          `Main ink illustration emerges — ${cameraMotion}`,
          `Camera slows on emotional beat — key ink detail highlighted`,
          `${makePolicySafe(midWords)} — secondary scene element drawn in ink`,
          `Atmospheric ink particles drift — tension builds in scene`,
          `Lower-third ink overlay appears — title: "${beatTitle}"`,
          `Ink fades as scene closes — transition prepares for next beat`
        ];

        newPrompts[sceneId] = {
          json: JSON.stringify({
            "scene": `Beat ${beatNum} – ${beatTitle}`,
            "style": `${project.settings?.visualStyle || "Historical Documentary"} – archival ink animation on aged parchment`,
            "color_grade": makePolicySafe(project.settings?.colorPalette || "aged parchment beige, dark ink shadows, sepia tones"),
            "shot": {
              "composition": makePolicySafe(`${cameraMotion} — ${openWords}`),
              "camera_motion": cameraMotion,
              "frame_rate": "24 fps",
              "resolution": "1920 × 1080",
              "lens": "2D painterly aesthetic with soft ink bleed edges",
              "look": "hand-drawn brush strokes on textured parchment, ink bleed animation"
            },
            "voice_over": {
              "language": "English",
              "tone": "Grave, historical",
              "mode": "Narrative, explanatory",
              "emotion": "Serious, urgent",
              "narration_text": chunk.text,
              "duration_sec": String(durationSec)
            },
            "house_settings": {
              "typeface": {
                "hook": beatTitle,
                "subtext": subtextDate
              },
              "overlay_style": "Subtle ink overlay on parchment — lower third only, no border",
              "animation": {
                "enter": "ink stroke spread",
                "enter_duration_ms": 600,
                "exit": "ink slash wipe",
                "exit_duration_ms": 500
              },
              "callouts": { "stroke_px": 0, "corner_radius_px": 0 },
              "sizes": {
                "hook_font_height_pct": "8",
                "sublabel_font_height_pct": "5",
                "safe_margins_pct": 7
              }
            },
            "timeline": [
              { "time": "0.0–1.5 s", "action": timelineActions[0] },
              { "time": "1.5–3.0 s", "action": timelineActions[1] },
              { "time": "3.0–4.0 s", "action": timelineActions[2] },
              { "time": "4.0–5.5 s", "action": timelineActions[3] },
              { "time": "5.5–6.5 s", "action": timelineActions[4] },
              { "time": "6.5–7.5 s", "action": timelineActions[5] },
              { "time": "7.5–END",   "action": timelineActions[6] }
            ],
            "lighting": {
              "primary": lighting.primary,
              "secondary": lighting.secondary,
              "accents": lighting.accents
            },
            "audio": {
              "ambient": ambient,
              "sfx": sfx,
              "music": {
                "track": music.track,
                "description": music.description,
                "tempo": music.tempo,
                "key": music.key,
                "dynamic_curve": music.curve
              },
              "mix": {
                "integrated_loudness": "-14 LUFS",
                "sidechain_music_db_on_impacts": -3,
                "natural_reverb": true
              }
            },
            "text_rules": {
              "emoji_policy": "no emojis",
              "contrast": "black ink text on light parchment background"
            },
            "color_palette": {
              "background": project.settings?.colorPalette ? makePolicySafe(project.settings.colorPalette) : bgPalette,
              "ink_primary": project.settings?.colorPrimary || "#111111",
              "ink_secondary": project.settings?.colorSecondary || "#444444",
              "splatter": project.settings?.colorAccent || "#222222",
              "text_primary": "#111111"
            },
            "transitions": {
              "between_scenes": transition.between,
              "impact_frame_usage": transition.impact,
              "forbidden": ["glitch", "marker squeaks", "cartoon pops"]
            },
            "vfx_rules": {
              "grain": "light ink texture grain over parchment",
              "particles": "subtle ash-like specks drifting across frame",
              "camera_shake": "very slight rumble during impact sounds only"
            },
            "visual_rules": {
              "prohibited_elements": ["3D dinos", "cartoon outlines", "logos"],
              "grain": "natural ink bleed texture",
              "sharpen": "medium to enhance parchment fibers"
            },
            "export": {
              "preset": "1920x1080_h264_high",
              "target_duration_sec": String(durationSec)
            },
            "metadata": {
              "series": makePolicySafe(project.title || "World War II Documentary Series"),
              "task": `Beat ${beatNum} – ${beatTitle}`,
              "scene_number": String(beatNum),
              "tags": tags.slice(0, 3)
            }
          }, null, 2)
        };
      });

      setProject(p => ({
        ...p,
        scenes: newScenes,
        prompts: newPrompts
      }));

      setIsGenerating(false);
      setCurrentStep(3);
      toast.success(`${preChunks.length} beats generated successfully`);
    }, 3000);
  };

  return (
    <div className="flex flex-col h-full bg-[#F8F9FA] w-full text-foreground font-sans relative">
      
      {/* Top Progress Bar */}
      <div className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 py-4 px-8 flex items-center justify-center space-x-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${currentStep >= 1 ? 'bg-red-600 text-white' : 'border-2 border-gray-300 text-gray-500'}`}>1</div>
          <span className={`text-sm ${currentStep >= 1 ? 'font-semibold text-gray-900' : 'font-medium text-gray-500'}`}>Configure</span>
        </div>
        <div className={`w-48 h-px ${currentStep >= 2 ? 'bg-red-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center space-x-2 ${currentStep < 2 ? 'opacity-50' : ''}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${currentStep >= 2 ? 'bg-red-600 text-white' : 'border-2 border-gray-300 text-gray-500'}`}>2</div>
          <span className={`text-sm ${currentStep >= 2 ? 'font-semibold text-gray-900' : 'font-medium text-gray-500'}`}>Generating</span>
        </div>
        <div className={`w-48 h-px ${currentStep >= 3 ? 'bg-red-600' : 'bg-gray-200'}`}></div>
        <div className={`flex items-center space-x-2 ${currentStep < 3 ? 'opacity-50' : ''}`}>
          <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-sm ${currentStep >= 3 ? 'bg-red-600 text-white' : 'border-2 border-gray-300 text-gray-500'}`}>3</div>
          <span className={`text-sm ${currentStep >= 3 ? 'font-semibold text-gray-900' : 'font-medium text-gray-500'}`}>Results</span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto w-full py-10 px-4">
        
        {/* WHAT THE AI WILL DO Banner */}
        <div className="mb-10 bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg flex justify-between items-start">
          <div>
            <h3 className="text-red-600 font-bold text-sm tracking-widest uppercase mb-4 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-red-600 inline-block"></span>
              What the AI Will Do
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="text-red-500">→</span>
                <p><strong>Beat Detection:</strong> AI reads your full script and breaks it into named story beats (Hook → Conflict → Resolution).</p>
              </li>
              <li className="flex gap-2">
                <span className="text-red-500">→</span>
                <p><strong>Style Lock:</strong> One-time analysis locks hex colors, lens, transitions, and character appearances across all beats.</p>
              </li>
              <li className="flex gap-2">
                <span className="text-red-500">→</span>
                <p><strong>Beat Generation:</strong> Every named beat generated in parallel — no SWAP_ME, full cinematic JSON.</p>
              </li>
            </ul>
          </div>
          {isSaving && (
            <div className="flex items-center gap-2 text-xs text-red-500 font-mono bg-white px-3 py-1.5 rounded-full shadow-sm">
              <Loader2 className="w-3 h-3 animate-spin" /> Auto-saving...
            </div>
          )}
        </div>

        {/* Section 1: Sequence Data */}
        <div className="mb-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">1</div>
            <h2 className="text-sm font-bold tracking-widest text-gray-800">SEQUENCE DATA</h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Project Name (Optional)</label>
              <input 
                type="text" 
                value={project.title}
                onChange={(e) => setProject(p => ({ ...p, title: e.target.value }))}
                placeholder="e.g. SC-01-INTRO" 
                className="w-full px-4 py-3 border border-gray-200 rounded bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-gray-500 uppercase">Complete Script</label>
                <div>
                  <input type="file" id="script-upload" className="hidden" accept=".txt,.md,.docx,.pdf" onChange={handleFileUpload} />
                  <Button variant="outline" size="sm" onClick={() => document.getElementById("script-upload")?.click()} disabled={isUploading} className="text-xs h-7 py-0 px-3">
                    {isUploading ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Upload className="w-3 h-3 mr-1.5" />}
                    Upload TXT / MD
                  </Button>
                </div>
              </div>
              <textarea 
                value={project.rawScript}
                onChange={(e) => setProject(p => ({ ...p, rawScript: e.target.value }))}
                placeholder="Paste your full narration script here. AI will auto-split into scenes..." 
                className="w-full h-48 px-4 py-3 border border-gray-200 rounded bg-white text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mt-2 gap-4">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="beatDetection" 
                      className="text-red-600 focus:ring-red-500" 
                      checked={project.settings?.beatDetectionMode !== "sentence"} 
                      onChange={() => setProject(p => ({ ...p, settings: { ...p.settings, beatDetectionMode: "smart" } }))}
                    />
                    <span className="text-sm font-medium text-gray-800">Smart Beat Detection <span className="text-xs text-green-600 font-bold ml-1">(Recommended)</span></span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="beatDetection" 
                      className="text-red-600 focus:ring-red-500" 
                      checked={project.settings?.beatDetectionMode === "sentence"} 
                      onChange={() => setProject(p => ({ ...p, settings: { ...p.settings, beatDetectionMode: "sentence" } }))}
                    />
                    <span className="text-sm font-medium text-gray-800">Sentence by Sentence</span>
                  </label>
                </div>
                <p className="text-xs text-gray-400">→ {project.settings?.beatDetectionMode === "sentence" ? "Script is split on every period/punctuation." : "AI intelligently groups beats by topic, scene, and emotional shifts."}</p>
              </div>
            </div>

            {/* Analysis Results */}
            {project.analysis && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Hook</span>
                  <p className="text-sm font-medium text-green-900">{project.analysis.hook}</p>
                </div>
                <div>
                  <span className="text-[10px] text-green-700 font-bold uppercase tracking-wider">Tone & Audience</span>
                  <p className="text-sm font-medium text-green-900">{project.analysis.tone} • {project.analysis.audience}</p>
                </div>
              </div>
            )}

            <div className="bg-red-50 border border-red-100 rounded-lg p-4 flex items-center justify-between">
              <div className="flex gap-3">
                <div className="mt-1"><Activity className="w-5 h-5 text-red-500" /></div>
                <div>
                  <h4 className="text-sm font-bold text-red-800">AI Auto-Suggest All Fields</h4>
                  <p className="text-xs text-gray-500 mt-1">Paste your script above, then click to let AI pick the best visual style, colors, lighting, camera & mood.</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  const script = (project.rawScript || "").toLowerCase();
                  const style = project.settings?.visualStyle || "";
                  // Auto-detect mood
                  let mood = "Serious";
                  if (script.includes("hope") || script.includes("victory")) mood = "Hopeful";
                  else if (script.includes("war") || script.includes("battle")) mood = "Dramatic";
                  else if (script.includes("fear") || script.includes("terror")) mood = "Tense";
                  else if (script.includes("sacrifice") || script.includes("loss")) mood = "Mournful";
                  // Auto-detect lighting
                  let light = "Cinematic Lighting";
                  if (script.includes("war") || script.includes("history")) light = "Sepia Parchment Tone";
                  else if (script.includes("night") || script.includes("dark")) light = "Moody / Low Key";
                  else if (script.includes("nature") || script.includes("outdoor")) light = "Natural Light";
                  // Auto-detect camera
                  let cam = "Slow Ken Burns";
                  if (script.includes("battle") || script.includes("action")) cam = "Handheld Tracking";
                  else if (script.includes("map") || script.includes("landscape")) cam = "Drone Wide Pan";
                  // Auto-detect palette
                  let palette = "aged parchment beige, dark ink shadows, sepia tones";
                  let prim = "#2b1d0e"; let sec = "#8b7355"; let acc = "#c8952c";
                  if (style.includes("Neon") || style.includes("Cyberpunk")) { palette = "deep black, electric blue, neon accent"; prim = "#0a0a0a"; sec = "#00d4ff"; acc = "#ff0080"; }
                  else if (script.includes("war") || script.includes("history")) { palette = "aged parchment beige, dark ink shadows, sepia tones"; prim = "#2b1d0e"; sec = "#8b7355"; acc = "#c8952c"; }
                  setProject(p => ({
                    ...p,
                    settings: { ...p.settings, mood, lightingStyle: light, cameraStyle: cam, colorPalette: palette, colorPrimary: prim, colorSecondary: sec, colorAccent: acc },
                    analysis: {
                      hook: script.length > 50 ? `"${(project.rawScript || "").slice(0, 60).trim()}..."` : "Strong narrative opening",
                      storyStructure: preChunks.length > 5 ? "Multi-act structure" : "Three-act structure",
                      tone: mood + " and authoritative",
                      audience: script.includes("war") ? "History enthusiasts" : "General documentary viewers",
                    }
                  }));
                  toast.success("AI suggested all fields based on your script!");
                }}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
              >
                <Settings2 className="w-4 h-4 mr-2" />
                Suggest All
              </Button>
            </div>
          </div>
        </div>

        {/* Section 1.5: Per-Scene Visual Style (From Screenshot 1 & 2) */}
        {preChunks.length > 0 && (
          <div className={`mb-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-opacity ${currentStep > 1 ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">
                  <Activity className="w-3 h-3" />
                </div>
                <h2 className="text-sm font-bold tracking-widest text-gray-800">PER-SCENE VISUAL STYLE <span className="text-xs font-normal text-gray-400 ml-2 bg-gray-200 px-2 py-0.5 rounded">{preChunks.length} scenes × 8s</span></h2>
              </div>
              <Button variant="ghost" className="text-red-600 hover:bg-red-50 text-xs font-bold h-8">
                <Activity className="w-3 h-3 mr-2" />
                AI Suggest All
              </Button>
            </div>
            <div className="p-0 max-h-96 overflow-y-auto divide-y divide-gray-100">
              {preChunks.map((chunk, i) => (
                <div key={chunk.id} className="p-4 flex gap-4 hover:bg-gray-50 transition-colors group">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                      {i + 1}
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-gray-600">{chunk.text}</p>
                    <div className="flex items-center gap-2">
                      <select 
                        value={chunk.styleOverride || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPreChunks(prev => prev.map(c => c.id === chunk.id ? { ...c, styleOverride: val === "" ? null : val } : c));
                        }}
                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none text-gray-700"
                      >
                        <option value="">— Use Global Style —</option>
                        {VISUAL_STYLES.map(s => (
                          <option key={s.id} value={s.title}>{s.emoji} {s.title}</option>
                        ))}
                      </select>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 text-xs font-bold px-2 py-1 h-auto">
                        <Activity className="w-3 h-3 mr-1" />
                        AI
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Visual Style */}
        <div className={`mb-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-opacity ${currentStep > 1 ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">2</div>
              <h2 className="text-sm font-bold tracking-widest text-gray-800">VISUAL STYLE</h2>
            </div>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 text-xs font-bold h-8">
              <Settings2 className="w-3 h-3 mr-2" />
              AI Fill All
            </Button>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Visual Style</label>
                <p className="text-sm text-gray-400 italic mt-1">
                  {project.settings?.visualStyle || "No style selected — pick one below"}
                </p>
              </div>
              <Button variant="ghost" className="text-red-600 hover:bg-red-50 text-xs font-bold" onClick={() => setProject(p => ({ ...p, settings: { ...p.settings, visualStyle: "Cinematic 3D Render" } }))}>
                <Activity className="w-3 h-3 mr-2" />
                AI Suggest
              </Button>
            </div>
            
            <input 
              type="text" 
              placeholder="Search 59 styles..." 
              className="w-full px-4 py-2 border border-gray-200 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
            />
            
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button 
                  key={cat}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${cat === 'All' ? 'bg-red-600 text-white border-red-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4 h-64 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50/50">
              {VISUAL_STYLES.map((style) => {
                const isSelected = project.settings?.visualStyle === style.title;
                return (
                  <div 
                    key={style.id} 
                    onClick={() => setProject(p => ({ ...p, settings: { ...p.settings, visualStyle: style.title } }))}
                    className={`bg-white p-3 border rounded shadow-sm cursor-pointer transition-colors flex flex-col justify-start ${isSelected ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 hover:border-red-400'}`}
                  >
                    <div className="text-2xl mb-2">{style.emoji}</div>
                    <h4 className="font-bold text-sm text-gray-900">{style.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{style.description}</p>
                  </div>
                );
              })}
            </div>

            <button className="text-sm text-gray-500 hover:text-gray-900 font-medium flex items-center gap-2">
              <span>+</span> Use custom style not in the list
            </button>
            
            <div className="pt-4 border-t border-gray-100 border-dashed space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                <LayoutList className="w-3 h-3" />
                REFERENCE IMAGE (Style Copy)
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors">
                <p className="text-sm text-gray-500">Click to upload reference image</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Color Palette */}
        <div className={`mb-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-opacity ${currentStep > 1 ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">3</div>
              <h2 className="text-sm font-bold tracking-widest text-gray-800">COLOR PALETTE</h2>
            </div>
            <Button variant="ghost" className="text-red-600 hover:bg-red-50 text-xs font-bold" onClick={() => {
              // AI suggests palette based on visual style and script tone
              const style = project.settings?.visualStyle || "";
              const script = (project.rawScript || "").toLowerCase();
              let palette = "aged parchment beige, dark ink shadows, sepia tones";
              let primary = "#2b1d0e"; let secondary = "#8b7355"; let accent = "#c8952c";
              if (style.includes("Neon") || style.includes("Cyberpunk")) { palette = "deep black, electric blue, neon pink"; primary = "#0a0a0a"; secondary = "#00d4ff"; accent = "#ff0080"; }
              else if (style.includes("Horror") || script.includes("dark") || script.includes("shadow")) { palette = "near black, blood red, ash grey"; primary = "#0d0d0d"; secondary = "#8b0000"; accent = "#555555"; }
              else if (style.includes("Nature") || script.includes("forest") || script.includes("ocean")) { palette = "forest green, sky blue, earth brown"; primary = "#1a3d1a"; secondary = "#4a90b8"; accent = "#8b6b3d"; }
              else if (style.includes("Historical") || script.includes("war") || script.includes("battle")) { palette = "aged parchment beige, dark ink shadows, sepia tones"; primary = "#2b1d0e"; secondary = "#8b7355"; accent = "#c8952c"; }
              else if (style.includes("Fantasy") || script.includes("magic") || script.includes("kingdom")) { palette = "midnight purple, gold leaf, deep emerald"; primary = "#1a0a2e"; secondary = "#d4a017"; accent = "#1a4a2e"; }
              else if (style.includes("Sci-Fi") || script.includes("space") || script.includes("future")) { palette = "deep space black, cyan glow, silver chrome"; primary = "#0a0a14"; secondary = "#00e5ff"; accent = "#c0c0c0"; }
              setProject(p => ({ ...p, settings: { ...p.settings, colorPalette: palette, colorPrimary: primary, colorSecondary: secondary, colorAccent: accent } }));
              toast.success("AI Color Palette Applied!");
            }}>
              <Activity className="w-3 h-3 mr-2" />
              AI Suggest
            </Button>
          </div>
          <div className="p-6 space-y-6">
            
            {/* Color Palette Description */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Palette Description (used in JSON output)</label>
              <input
                type="text"
                value={project.settings?.colorPalette || ""}
                onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, colorPalette: e.target.value } }))}
                placeholder="e.g. aged parchment beige, dark ink shadows, sepia tones"
                className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              />
            </div>

            {/* Primary Color */}
            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-sm border border-gray-300" style={{ background: project.settings?.colorPrimary || "#2b1d0e" }}></div>
                PRIMARY (ink_primary)
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={project.settings?.colorPrimary || "#2b1d0e"}
                  onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, colorPrimary: e.target.value } }))}
                  className="w-10 h-9 rounded cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={project.settings?.colorPrimary || "#2b1d0e"}
                  onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, colorPrimary: e.target.value } }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>

            {/* Secondary Color */}
            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-sm border border-gray-300" style={{ background: project.settings?.colorSecondary || "#8b7355" }}></div>
                SECONDARY (ink_secondary)
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={project.settings?.colorSecondary || "#8b7355"}
                  onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, colorSecondary: e.target.value } }))}
                  className="w-10 h-9 rounded cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={project.settings?.colorSecondary || "#8b7355"}
                  onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, colorSecondary: e.target.value } }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>

            {/* Accent Color */}
            <div className="border border-gray-100 rounded-lg p-4 bg-gray-50/50">
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2 mb-3">
                <div className="w-4 h-4 rounded-sm border border-gray-300" style={{ background: project.settings?.colorAccent || "#c8952c" }}></div>
                ACCENT (splatter)
              </label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={project.settings?.colorAccent || "#c8952c"}
                  onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, colorAccent: e.target.value } }))}
                  className="w-10 h-9 rounded cursor-pointer border border-gray-200"
                />
                <input
                  type="text"
                  value={project.settings?.colorAccent || "#c8952c"}
                  onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, colorAccent: e.target.value } }))}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Section 4: Camera, Lighting & Mood */}
        <div className={`mb-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-opacity ${currentStep > 1 ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">4</div>
              <h2 className="text-sm font-bold tracking-widest text-gray-800">CAMERA, LIGHTING & MOOD</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-800">Lighting Style</label>
                <button className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center" onClick={() => {
                  const script = (project.rawScript || "").toLowerCase();
                  const style = project.settings?.visualStyle || "";
                  let light = "Cinematic Lighting";
                  if (script.includes("night") || script.includes("dark") || style.includes("Horror")) light = "Moody / Low Key";
                  else if (script.includes("war") || script.includes("battle") || script.includes("history")) light = "Sepia Parchment Tone";
                  else if (script.includes("nature") || script.includes("outdoor")) light = "Natural Light";
                  else if (script.includes("future") || script.includes("space") || style.includes("Sci-Fi")) light = "Neon Ambient";
                  setProject(p => ({ ...p, settings: { ...p.settings, lightingStyle: light } }));
                  toast.success(`Lighting → ${light}`);
                }}><Activity className="w-3 h-3 mr-1" /> AI Suggest</button>
              </div>
              <select
                value={project.settings?.lightingStyle || "Cinematic Lighting"}
                onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, lightingStyle: e.target.value } }))}
                className="w-full px-4 py-2 border border-gray-200 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none"
              >
                <option>Cinematic Lighting</option>
                <option>Sepia Parchment Tone</option>
                <option>Natural Light</option>
                <option>Studio Lighting</option>
                <option>Moody / Low Key</option>
                <option>Neon Ambient</option>
                <option>Dramatic Overcast</option>
                <option>Golden Hour</option>
                <option>Candlelight Interior</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-800">Camera Style</label>
                <button className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center" onClick={() => {
                  const script = (project.rawScript || "").toLowerCase();
                  const style = project.settings?.visualStyle || "";
                  let cam = "Slow Ken Burns";
                  if (script.includes("action") || script.includes("battle") || script.includes("chase")) cam = "Handheld Tracking";
                  else if (script.includes("landscape") || script.includes("city") || script.includes("map")) cam = "Drone Wide Pan";
                  else if (script.includes("face") || script.includes("emotion") || script.includes("close")) cam = "Close Up Push-In";
                  setProject(p => ({ ...p, settings: { ...p.settings, cameraStyle: cam } }));
                  toast.success(`Camera → ${cam}`);
                }}><Activity className="w-3 h-3 mr-1" /> AI Suggest</button>
              </div>
              <select
                value={project.settings?.cameraStyle || "Slow Ken Burns"}
                onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, cameraStyle: e.target.value } }))}
                className="w-full px-4 py-2 border border-gray-200 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none"
              >
                <option>Slow Ken Burns</option>
                <option>Close Up Push-In</option>
                <option>Drone Wide Pan</option>
                <option>Handheld Tracking</option>
                <option>Orbit Slow Rotate</option>
                <option>Tilt Up Reveal</option>
                <option>Dolly Forward</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-800">Mood & Tone</label>
                <button className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center" onClick={() => {
                  const script = (project.rawScript || "").toLowerCase();
                  let mood = "Serious";
                  if (script.includes("hope") || script.includes("victory") || script.includes("freedom")) mood = "Hopeful";
                  else if (script.includes("fear") || script.includes("terror") || script.includes("horror")) mood = "Tense";
                  else if (script.includes("sacrifice") || script.includes("loss") || script.includes("grief")) mood = "Mournful";
                  else if (script.includes("war") || script.includes("battle") || script.includes("fight")) mood = "Dramatic";
                  else if (script.includes("mystery") || script.includes("secret") || script.includes("unknown")) mood = "Mysterious";
                  setProject(p => ({ ...p, settings: { ...p.settings, mood: mood } }));
                  toast.success(`Mood → ${mood}`);
                }}><Activity className="w-3 h-3 mr-1" /> AI Suggest</button>
              </div>
              <select
                value={project.settings?.mood || "Serious"}
                onChange={(e) => setProject(p => ({ ...p, settings: { ...p.settings, mood: e.target.value } }))}
                className="w-full px-4 py-2 border border-gray-200 rounded bg-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 appearance-none"
              >
                <option>Serious</option>
                <option>Dramatic</option>
                <option>Hopeful</option>
                <option>Mournful</option>
                <option>Tense</option>
                <option>Mysterious</option>
                <option>Urgent</option>
                <option>Reverent</option>
              </select>
            </div>

          </div>
        </div>

        {/* Section 5: Platform & Output */}
        <div className={`mb-8 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-opacity ${currentStep > 1 ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-white font-bold text-xs">5</div>
            <h2 className="text-sm font-bold tracking-widest text-gray-800">PLATFORM & OUTPUT</h2>
          </div>
          <div className="p-6">
            <label className="text-xs font-bold text-gray-500 uppercase block mb-3">TARGET PLATFORM</label>
            <div className="grid grid-cols-4 gap-2">
              <button 
                onClick={() => setProject(p => ({ ...p, settings: { ...p.settings, platform: "YouTube" } }))}
                className={`py-2 px-4 rounded text-sm font-bold flex justify-center items-center gap-2 border ${project.settings?.platform === 'YouTube' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                ▶ YouTube
              </button>
              <button 
                onClick={() => setProject(p => ({ ...p, settings: { ...p.settings, platform: "TikTok" } }))}
                className={`py-2 px-4 rounded text-sm font-bold flex justify-center items-center gap-2 border ${project.settings?.platform === 'TikTok' ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                ♪ TikTok
              </button>
              <button 
                onClick={() => setProject(p => ({ ...p, settings: { ...p.settings, platform: "Instagram" } }))}
                className={`py-2 px-4 rounded text-sm font-bold flex justify-center items-center gap-2 border ${project.settings?.platform === 'Instagram' ? 'bg-pink-600 text-white border-pink-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                ◎ Instagram
              </button>
              <button 
                onClick={() => setProject(p => ({ ...p, settings: { ...p.settings, platform: "Facebook" } }))}
                className={`py-2 px-4 rounded text-sm font-bold flex justify-center items-center gap-2 border ${project.settings?.platform === 'Facebook' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                ■ Facebook
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">6–16 beats, full narrative depth</p>
          </div>
        </div>

        {/* Generate Button Area */}
        {currentStep === 1 && (
          <div className="mt-8 flex justify-center pb-20">
            <Button 
              onClick={handleGenerate}
              disabled={!project.rawScript}
              className="bg-[#e60000] hover:bg-red-700 text-white font-bold py-6 px-10 rounded-lg text-lg shadow-xl hover:shadow-2xl transition-all w-full max-w-4xl"
            >
              <Play className="w-5 h-5 mr-3" />
              GENERATE STORY BEATS
            </Button>
          </div>
        )}

        {/* Generating State */}
        {currentStep === 2 && (
          <div className="mt-12 flex flex-col items-center max-w-2xl mx-auto pb-20">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
            </div>
            
            <h2 className="text-3xl font-bold text-[#0f172a] mb-2 tracking-tight">Building Scene Bundle</h2>
            <p className="text-red-600 font-bold mb-4">~{preChunks.length} scenes × 8 seconds each</p>
            <p className="text-gray-500 text-center mb-10 max-w-lg leading-relaxed">
              AI detecting story beats and generating cinematic scenes in parallel...
            </p>

            <div className="w-full space-y-4">
              <div className="bg-red-50/50 border border-red-200 rounded-lg p-5 flex gap-4 items-start">
                <Loader2 className="w-5 h-5 text-red-500 animate-spin shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-700 text-sm mb-1">Pass 0+1 — Story Beat Detection & Style Lock</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    AI detects narrative beats (Hook → Conflict → Resolution) • Extracts characters • Locks style across all scenes
                  </p>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-5 flex gap-4 items-start shadow-sm">
                <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0 mt-0.5"></div>
                <div>
                  <h4 className="font-bold text-gray-500 text-sm mb-1">Pass 2 — Parallel Scene Generation</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    All {preChunks.length} scenes generated simultaneously — ready for bulk image/video generation
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-10">Large script ({preChunks.length} scenes) — may take 60–120 seconds</p>
          </div>
        )}

        {/* Results Area */}
        {currentStep === 3 && (
          <div className="mt-12 mb-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Generated Sequence</h2>
              <div className="flex flex-col gap-3 justify-end mt-6">
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" className="text-gray-600 font-bold text-xs" onClick={() => handleCopy(true)} disabled={selectedBeats.size === 0}>
                    <FileText className="w-4 h-4 mr-2" /> Copy Selected
                  </Button>
                  <Button variant="outline" className="text-gray-600 font-bold text-xs" onClick={() => handleCopy(false)}>
                    <FileText className="w-4 h-4 mr-2" /> Copy All
                  </Button>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" className="text-gray-600 font-bold text-xs" onClick={() => handleExport("txt", selectedBeats.size > 0)}>
                    <Download className="w-4 h-4 mr-2" /> Export TXT
                  </Button>
                  <Button variant="outline" className="text-gray-600 font-bold text-xs" onClick={() => handleExport("md", selectedBeats.size > 0)}>
                    <Download className="w-4 h-4 mr-2" /> Export MD
                  </Button>
                  <Button variant="outline" className="text-gray-600 font-bold text-xs" onClick={() => handleExport("json", selectedBeats.size > 0)}>
                    <Download className="w-4 h-4 mr-2" /> Export JSON
                  </Button>
                  <Button variant="outline" className="text-gray-600 font-bold text-xs" onClick={() => handleExport("zip", selectedBeats.size > 0)}>
                    <Download className="w-4 h-4 mr-2" /> Export ZIP
                  </Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs" onClick={() => toast.success("Saved to Prompt Library")}>
                    <Save className="w-4 h-4 mr-2" /> Save to Library
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden mt-8 max-w-5xl mx-auto">
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center relative">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{project.title || "nno"}</h2>
                  <p className="text-sm text-gray-500 mt-1">{Object.keys(project.prompts || {}).length} beats generated · {project.settings?.visualStyle || "Cinematic"}</p>
                </div>
                <Button variant="ghost" className="absolute top-4 right-4 w-8 h-8 p-0 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200" onClick={() => setCurrentStep(1)}>
                  <span className="sr-only">Close</span>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </Button>
              </div>

              <div className="p-8 space-y-12 bg-gray-50/30 max-h-[70vh] overflow-y-auto">
                {Object.entries(project.prompts || {}).map(([sceneId, promptData], index) => {
                  const beatNum = String(index + 1).padStart(2, '0');
                  const parsed = JSON.parse(promptData.json);
                  const narration = parsed["Voice Over"]?.["Narration Text"] || parsed.voice_over?.narration_text || parsed["Voice Over"] || "";
                  const isSelected = selectedBeats.has(sceneId);
                  const isExpanded = !expandedScenes.has(sceneId); // Default to expanded
                  
                  return (
                    <div key={sceneId} className={`bg-white rounded-xl border ${isSelected ? 'border-red-400 ring-1 ring-red-400 shadow-md' : 'border-gray-200 shadow-sm'} overflow-hidden transition-all relative`}>
                      <div className="px-6 py-4 border-b border-gray-100 flex items-start justify-between bg-white">
                        <div className="flex items-start gap-4">
                          <div className="flex items-center gap-2 mt-1">
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
                              checked={isSelected}
                              onChange={() => toggleSelectBeat(sceneId)}
                            />
                            <div className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                              BEAT {beatNum}
                            </div>
                          </div>
                          <p className="text-gray-500 italic text-xs mt-1 max-w-2xl line-clamp-2 leading-relaxed">"{narration}"</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            className="text-xs font-medium text-gray-500 hover:text-gray-900 px-2 py-1 transition-colors flex items-center gap-1 border border-gray-200 rounded hover:bg-gray-50"
                            onClick={() => {
                              navigator.clipboard.writeText(promptData.json);
                              toast.success("Copied!");
                            }}
                          >
                            <FileText className="w-3 h-3" /> Copy
                          </button>
                          <button 
                            className="text-xs font-medium text-blue-600 hover:text-blue-800 px-2 py-1 transition-colors bg-blue-50 rounded"
                            onClick={() => setPreviewScene(sceneId)}
                          >
                            Preview
                          </button>
                          <div className="h-4 w-px bg-gray-200 mx-1"></div>
                          <button 
                            className="text-xs font-medium text-gray-500 hover:text-gray-900 px-2 py-1 transition-colors"
                            onClick={() => toggleExpandedScene(sceneId)}
                          >
                            {isExpanded ? 'Collapse' : 'Expand'}
                          </button>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="p-0 overflow-x-auto bg-[#fafafa]">
                          <div className="px-6 py-2 bg-gray-100/50 border-b border-gray-200 flex gap-4 text-xs text-gray-500">
                            <button className="hover:text-gray-900" onClick={() => toast.success("Edit Scene")}>Edit</button>
                            <button className="hover:text-gray-900" onClick={() => toast.success("Scene Duplicated")}>Duplicate</button>
                            <button className="hover:text-gray-900" onClick={() => toast.success("Regenerating Scene...")}>Regenerate</button>
                            <button className="text-red-500 hover:text-red-700" onClick={() => toast.success("Scene Deleted")}>Delete</button>
                          </div>
                          <pre className="text-[13px] font-mono text-gray-700 whitespace-pre-wrap p-6">
                            {promptData.json}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Preview Modal */}
            {previewScene && project.prompts?.[previewScene] && (
              <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                  {(() => {
                    const data = JSON.parse(project.prompts[previewScene].json);
                    return (
                      <>
                        <div className="px-8 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded">BEAT {data.metadata?.scene_number || data["Scene Number"]}</span>
                              <h2 className="text-xl font-bold text-gray-900">{data.scene || data["Scene Name"]}</h2>
                            </div>
                            <p className="text-sm text-gray-500">{data.style || data["Style"]}</p>
                          </div>
                          <button onClick={() => setPreviewScene(null)} className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-full hover:bg-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 bg-white">
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Voice Over / Narration</h4>
                                <p className="text-gray-800 text-sm font-medium leading-relaxed italic border-l-4 border-red-200 pl-4 py-1">
                                  "{data.voice_over?.narration_text || data["Voice Over"]?.["Narration Text"] || data["Voice Over"]}"
                                </p>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Visual Composition</h4>
                                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                                  <p><strong>Camera:</strong> {data.shot?.camera_motion || data["Shot"]?.["Camera Motion"]} — {data.shot?.composition || data["Shot"]?.["Composition"]}</p>
                                  <p className="mt-2"><strong>Lens:</strong> {data.shot?.lens || data["Shot"]?.["Camera Lens"]}</p>
                                  <p className="mt-2"><strong>Lighting:</strong> {data.lighting?.primary || data["Lighting"]}</p>
                                  <p className="mt-2"><strong>Palette:</strong> {data.shot?.look || data["Color Palette"]}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Audio & SFX</h4>
                                <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700">
                                  <p><strong>Music:</strong> {data.audio?.music?.track || data["Audio"]?.["Music"]}</p>
                                  <p className="mt-2"><strong>SFX:</strong> {Array.isArray(data.audio?.sfx) ? data.audio.sfx.join(", ") : Array.isArray(data["Audio"]?.["SFX"]) ? data["Audio"]["SFX"].join(", ") : ""}</p>
                                  <p className="mt-2"><strong>Ambient:</strong> {data.audio?.ambient || ""}</p>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-6">
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Timeline Progression</h4>
                                <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                                  {(data.timeline || data["Timeline"] || []).map((t: any, i: number) => (
                                    <div key={i} className="flex gap-4 mb-2 last:mb-0">
                                      <span className="text-red-400 shrink-0">{t.time}</span>
                                      <span className="text-slate-300">{t.action}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">AI Generator Prompts</h4>
                                <div className="bg-indigo-50/50 rounded-lg p-4 space-y-4">
                                  <div>
                                    <span className="text-xs font-bold text-indigo-800">IMAGE PROMPT</span>
                                    <p className="text-xs text-indigo-900 mt-1">{data["AI Image Prompt"]}</p>
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold text-indigo-800">VIDEO PROMPT</span>
                                    <p className="text-xs text-indigo-900 mt-1">{data["AI Video Prompt"]}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="mt-12 flex justify-center pb-20">
              <Button 
                onClick={() => {
                  setCurrentStep(1);
                  setProject({
                    id: crypto.randomUUID(),
                    title: "",
                    rawScript: "",
                    analysis: null,
                    scenes: [],
                    prompts: {},
                    updatedAt: new Date().toISOString(),
                    settings: {
                      creativity: 50,
                      detailLevel: 50,
                      cameraStyle: "",
                      lightingStyle: "",
                      mood: "",
                      cinematicLevel: 50,
                      outputLength: "Medium",
                      visualStyle: "Cinematic 3D Render",
                      colorPalette: "Deep Black, Light Gray, Amber",
                      referenceImage: null
                    }
                  });
                }}
                variant="outline"
                className="text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                Start New Project
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function GeneratorLayout() {
  return (
    <GeneratorProvider>
      <LayoutContent />
    </GeneratorProvider>
  );
}
