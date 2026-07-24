"use client";

import React from "react";
import { useGenerator } from "../generator-context";
import { Settings2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PromptSettingsModule() {
  const { project, setProject } = useGenerator();

  const updateSetting = (key: string, value: any) => {
    setProject(p => ({
      ...p,
      settings: {
        ...p.settings,
        [key]: value
      }
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-primary" />
            Prompt Settings
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Configure global parameters used by the AI to generate production-ready prompts.</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase font-bold text-muted-foreground">General Style</Label>
            <Select value={project.settings.style} onValueChange={(v) => updateSetting("style", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Photorealistic">Photorealistic</SelectItem>
                <SelectItem value="Anime">Anime</SelectItem>
                <SelectItem value="3D Render">3D Render</SelectItem>
                <SelectItem value="Illustration">Illustration</SelectItem>
                <SelectItem value="Cinematic">Cinematic</SelectItem>
                <SelectItem value="Abstract">Abstract</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Camera Style</Label>
            <Select value={project.settings.cameraStyle} onValueChange={(v) => updateSetting("cameraStyle", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select camera style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cinematic">Cinematic Drone</SelectItem>
                <SelectItem value="Handheld">Handheld Documentary</SelectItem>
                <SelectItem value="Macro">Macro Photography</SelectItem>
                <SelectItem value="Wide Angle">Ultra Wide Angle</SelectItem>
                <SelectItem value="Telephoto">Telephoto Lens</SelectItem>
                <SelectItem value="Static">Static Tripod</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Lighting Style</Label>
            <Select value={project.settings.lightingStyle} onValueChange={(v) => updateSetting("lightingStyle", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select lighting" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Dramatic">Dramatic Contrast</SelectItem>
                <SelectItem value="Natural">Natural Sunlight</SelectItem>
                <SelectItem value="Neon">Cyberpunk Neon</SelectItem>
                <SelectItem value="Studio">Studio Softbox</SelectItem>
                <SelectItem value="Moody">Moody Cinematic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Overall Mood</Label>
            <Select value={project.settings.mood} onValueChange={(v) => updateSetting("mood", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select mood" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tense">Tense / Thriller</SelectItem>
                <SelectItem value="Uplifting">Uplifting / Hopeful</SelectItem>
                <SelectItem value="Dark">Dark / Ominous</SelectItem>
                <SelectItem value="Epic">Epic / Majestic</SelectItem>
                <SelectItem value="Calm">Calm / Serene</SelectItem>
                <SelectItem value="Energetic">Energetic / Fast-paced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase font-bold text-muted-foreground">Output Length</Label>
            <Select value={project.settings.outputLength} onValueChange={(v) => updateSetting("outputLength", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select length" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Short">Short (Concise, comma-separated)</SelectItem>
                <SelectItem value="Medium">Medium (Balanced details)</SelectItem>
                <SelectItem value="Long">Long (Extremely detailed, paragraph format)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </div>
    </div>
  );
}
