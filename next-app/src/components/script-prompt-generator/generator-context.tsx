"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type GeneratorTab =
  | "import"
  | "analysis"
  | "breakdown"
  | "generator"
  | "settings"
  | "library"
  | "export"
  | "history";

interface Scene {
  id: string;
  sceneNumber: number;
  voiceOver: string;
  visualDescription: string;
  cameraDirection: string;
  bRoll: string;
  onScreenText: string;
}

interface PromptSettings {
  style?: string;
  visualStyle?: string;
  colorPalette?: string;
  colorPrimary?: string;
  colorSecondary?: string;
  colorAccent?: string;
  referenceImage?: string | null;
  creativity: number;
  detailLevel: number;
  cameraStyle: string;
  lightingStyle: string;
  mood: string;
  cinematicLevel: number;
  outputLength: "Short" | "Medium" | "Long";
  platform?: "YouTube" | "TikTok" | "Instagram" | "Facebook";
  beatDetectionMode?: "smart" | "sentence";
}

interface ProjectState {
  id: string;
  title: string;
  rawScript: string;
  analysis: {
    hook: string;
    storyStructure: string;
    tone: string;
    audience: string;
  } | null;
  scenes: Scene[];
  prompts: Record<string, Record<string, string>>; // sceneId -> { image: "", video: "", ... }
  settings: PromptSettings;
  updatedAt: string;
}

interface GeneratorContextType {
  activeTab: GeneratorTab;
  setActiveTab: (tab: GeneratorTab) => void;
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
  isSaving: boolean;
  saveProject: () => Promise<void>;
}

const DEFAULT_SETTINGS: PromptSettings = {
  style: "Photorealistic",
  creativity: 70,
  detailLevel: 80,
  cameraStyle: "Cinematic",
  lightingStyle: "Dramatic",
  mood: "Tense",
  cinematicLevel: 90,
  outputLength: "Long",
};

const DEFAULT_PROJECT: ProjectState = {
  id: "",
  title: "Untitled Prompt Project",
  rawScript: "",
  analysis: null,
  scenes: [],
  prompts: {},
  settings: DEFAULT_SETTINGS,
  updatedAt: "",
};

const GeneratorContext = createContext<GeneratorContextType | undefined>(undefined);

export function GeneratorProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<GeneratorTab>("import");
  const [project, setProject] = useState<ProjectState>(DEFAULT_PROJECT);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Load draft logic would go here
    const saved = localStorage.getItem("prompt_generator_draft");
    if (saved) {
      try {
        setProject(JSON.parse(saved));
      } catch (e) {}
    } else {
      setProject(p => ({ ...p, id: crypto.randomUUID(), updatedAt: new Date().toISOString() }));
    }
  }, []);

  const saveProject = async () => {
    setIsSaving(true);
    // Simulate API delay
    await new Promise(r => setTimeout(r, 500));
    localStorage.setItem("prompt_generator_draft", JSON.stringify(project));
    setIsSaving(false);
  };

  // Auto-save logic
  useEffect(() => {
    if (!project.id) return;
    const t = setTimeout(() => {
      saveProject();
    }, 2000);
    return () => clearTimeout(t);
  }, [project]);

  return (
    <GeneratorContext.Provider
      value={{
        activeTab,
        setActiveTab,
        project,
        setProject,
        isSaving,
        saveProject,
      }}
    >
      {children}
    </GeneratorContext.Provider>
  );
}

export function useGenerator() {
  const context = useContext(GeneratorContext);
  if (!context) {
    throw new Error("useGenerator must be used within a GeneratorProvider");
  }
  return context;
}
