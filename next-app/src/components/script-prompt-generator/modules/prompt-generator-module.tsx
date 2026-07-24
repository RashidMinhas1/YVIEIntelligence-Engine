"use client";

import React, { useState } from "react";
import { useGenerator } from "../generator-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TerminalSquare, Loader2, Sparkles, Image as ImageIcon, Video, User, Map, Camera, Lightbulb, Clapperboard, Layers } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const PROMPT_TYPES = [
  { id: "image", label: "Image Prompt", icon: ImageIcon },
  { id: "video", label: "Video Prompt", icon: Video },
  { id: "character", label: "Character Prompt", icon: User },
  { id: "environment", label: "Environment Prompt", icon: Map },
  { id: "camera", label: "Camera Prompt", icon: Camera },
  { id: "lighting", label: "Lighting Prompt", icon: Lightbulb },
  { id: "cinematic", label: "Cinematic Prompt", icon: Clapperboard },
  { id: "broll", label: "B-Roll Prompt", icon: Layers },
];

export function PromptGeneratorModule() {
  const { project, setProject } = useGenerator();
  const [generatingFor, setGeneratingFor] = useState<{sceneId: string, typeId: string} | null>(null);

  const generatePrompt = async (sceneId: string, typeId: string) => {
    setGeneratingFor({ sceneId, typeId });
    try {
      // Stub generation
      await new Promise(r => setTimeout(r, 1200));
      
      const scene = project.scenes.find(s => s.id === sceneId);
      const generatedText = `[${typeId.toUpperCase()}] Detailed production prompt for Scene ${scene?.sceneNumber}. Style: ${project.settings.style}, Camera: ${project.settings.cameraStyle}, Lighting: ${project.settings.lightingStyle}, Mood: ${project.settings.mood}. Visuals: ${scene?.visualDescription}. Extremely high detail, 8k resolution, cinematic composition.`;

      setProject(p => ({
        ...p,
        prompts: {
          ...p.prompts,
          [sceneId]: {
            ...(p.prompts[sceneId] || {}),
            [typeId]: generatedText
          }
        }
      }));
      toast.success(`${typeId} prompt generated.`);
    } catch (e) {
      toast.error("Generation failed.");
    } finally {
      setGeneratingFor(null);
    }
  };

  const updatePrompt = (sceneId: string, typeId: string, value: string) => {
    setProject(p => ({
      ...p,
      prompts: {
        ...p.prompts,
        [sceneId]: {
          ...(p.prompts[sceneId] || {}),
          [typeId]: value
        }
      }
    }));
  };

  const generateAllForScene = async (sceneId: string) => {
    for (const type of PROMPT_TYPES) {
      await generatePrompt(sceneId, type.id);
    }
  };

  if (project.scenes.length === 0) {
    return (
      <div className="bg-card rounded-xl border shadow-sm p-12 text-center flex flex-col items-center">
        <TerminalSquare className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-bold">No Scenes Available</h3>
        <p className="text-muted-foreground text-sm max-w-md mt-2">
          You must detect or create scenes in the Scene Breakdown tab before generating prompts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TerminalSquare className="w-6 h-6 text-primary" />
            Prompt Generator
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Generate production-ready prompts for each scene without creating actual media.</p>
        </div>
      </div>

      <div className="space-y-6">
        {project.scenes.map((scene, index) => (
          <div key={scene.id} className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-bold text-sm bg-primary/10 text-primary px-2 py-0.5 rounded">Scene {scene.sceneNumber}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[300px]">{scene.visualDescription}</span>
              </div>
              <Button variant="outline" size="sm" onClick={() => generateAllForScene(scene.id)}>
                <Sparkles className="w-3.5 h-3.5 mr-2" /> Generate All Prompts
              </Button>
            </div>
            
            <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-6">
              {PROMPT_TYPES.map(type => {
                const currentPrompt = project.prompts[scene.id]?.[type.id] || "";
                const isGen = generatingFor?.sceneId === scene.id && generatingFor?.typeId === type.id;

                return (
                  <div key={type.id} className="space-y-2 border rounded-lg p-3 bg-muted/10 relative group">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                        <type.icon className="w-3.5 h-3.5" /> {type.label}
                      </label>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={() => generatePrompt(scene.id, type.id)}
                        disabled={isGen}
                      >
                        {isGen ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                      </Button>
                    </div>
                    {currentPrompt ? (
                      <Textarea 
                        value={currentPrompt}
                        onChange={(e) => updatePrompt(scene.id, type.id, e.target.value)}
                        className="min-h-[100px] text-xs font-mono leading-relaxed"
                      />
                    ) : (
                      <div className="min-h-[100px] border border-dashed rounded-md flex items-center justify-center text-xs text-muted-foreground">
                        {isGen ? "Generating highly detailed prompt..." : "No prompt generated yet."}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
