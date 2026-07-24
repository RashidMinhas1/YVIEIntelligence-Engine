"use client";

import React, { useState } from "react";
import { useGenerator } from "../generator-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LayoutList, ArrowRight, Loader2, Plus, Trash2, SplitSquareHorizontal } from "lucide-react";
import { toast } from "sonner";

export function SceneBreakdownModule() {
  const { project, setProject, setActiveTab } = useGenerator();
  const [isDetecting, setIsDetecting] = useState(false);

  const detectScenes = async () => {
    if (!project.rawScript) {
      toast.error("No script content to process.");
      return;
    }
    setIsDetecting(true);
    try {
      // Stub
      await new Promise(r => setTimeout(r, 2000));
      setProject(p => ({
        ...p,
        scenes: [
          {
            id: crypto.randomUUID(),
            sceneNumber: 1,
            voiceOver: "Welcome to this incredible journey.",
            visualDescription: "A wide sweeping drone shot of a misty mountain at sunrise.",
            cameraDirection: "Slow push in, low angle.",
            bRoll: "Time-lapse clouds rolling over peaks.",
            onScreenText: "The Journey Begins",
          },
          {
            id: crypto.randomUUID(),
            sceneNumber: 2,
            voiceOver: "Today we uncover the secrets of the ancients.",
            visualDescription: "Close up of an ancient manuscript being opened.",
            cameraDirection: "Over the shoulder, shallow depth of field.",
            bRoll: "Dust particles dancing in shafts of light.",
            onScreenText: "",
          }
        ]
      }));
      toast.success("Scenes detected automatically.");
    } catch (e) {
      toast.error("Scene detection failed.");
    } finally {
      setIsDetecting(false);
    }
  };

  const updateScene = (id: string, field: string, value: string) => {
    setProject(p => ({
      ...p,
      scenes: p.scenes.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const removeScene = (id: string) => {
    setProject(p => ({
      ...p,
      scenes: p.scenes.filter(s => s.id !== id)
    }));
  };

  const addScene = () => {
    setProject(p => ({
      ...p,
      scenes: [...p.scenes, {
        id: crypto.randomUUID(),
        sceneNumber: p.scenes.length + 1,
        voiceOver: "",
        visualDescription: "",
        cameraDirection: "",
        bRoll: "",
        onScreenText: "",
      }]
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <LayoutList className="w-6 h-6 text-primary" />
            Scene Breakdown
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Review and edit the logical scenes before generating prompts.</p>
        </div>
        <div className="flex gap-2">
          {project.scenes.length > 0 && (
            <Button variant="outline" onClick={addScene}>
              <Plus className="w-4 h-4 mr-2" /> Add Scene
            </Button>
          )}
          <Button onClick={detectScenes} disabled={isDetecting}>
            {isDetecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <SplitSquareHorizontal className="w-4 h-4 mr-2" />}
            {project.scenes.length > 0 ? "Re-Detect Scenes" : "Auto Detect Scenes"}
          </Button>
        </div>
      </div>

      {project.scenes.length === 0 && !isDetecting && (
        <div className="bg-card rounded-xl border shadow-sm p-12 text-center flex flex-col items-center">
          <SplitSquareHorizontal className="w-12 h-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold">No Scenes Detected</h3>
          <p className="text-muted-foreground text-sm max-w-md mt-2 mb-6">
            Let the AI automatically break down your script into logical scenes, separating voiceover from visual actions.
          </p>
          <Button onClick={detectScenes} size="lg">
            Start Scene Detection
          </Button>
        </div>
      )}

      {isDetecting && (
        <div className="bg-card rounded-xl border shadow-sm p-12 text-center flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
          <h3 className="text-lg font-bold">Slicing Script into Scenes...</h3>
        </div>
      )}

      <div className="space-y-4">
        {project.scenes.map((scene, index) => (
          <div key={scene.id} className="bg-card rounded-xl border shadow-sm overflow-hidden group">
            <div className="bg-muted/30 px-4 py-3 border-b flex items-center justify-between">
              <span className="font-bold text-sm">Scene {index + 1}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeScene(scene.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Voice Over / Dialogue</label>
                <Textarea 
                  value={scene.voiceOver} 
                  onChange={(e) => updateScene(scene.id, "voiceOver", e.target.value)}
                  className="h-24 resize-none text-sm"
                  placeholder="What is being said..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Visual Description</label>
                <Textarea 
                  value={scene.visualDescription} 
                  onChange={(e) => updateScene(scene.id, "visualDescription", e.target.value)}
                  className="h-24 resize-none text-sm"
                  placeholder="What is happening on screen..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">Camera Direction</label>
                <Textarea 
                  value={scene.cameraDirection} 
                  onChange={(e) => updateScene(scene.id, "cameraDirection", e.target.value)}
                  className="h-16 resize-none text-sm"
                  placeholder="Movement, angle, lens..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase">B-Roll / Overlays</label>
                <Textarea 
                  value={scene.bRoll} 
                  onChange={(e) => updateScene(scene.id, "bRoll", e.target.value)}
                  className="h-16 resize-none text-sm"
                  placeholder="Stock footage or text overlays..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {project.scenes.length > 0 && (
        <div className="flex justify-end pt-6">
          <Button onClick={() => setActiveTab("generator")} size="lg" className="font-bold">
            Proceed to Prompt Generator <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
}
