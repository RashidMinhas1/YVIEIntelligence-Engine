"use client";

import React, { useState, useCallback, useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { StudioProject, ScriptSection } from "@/lib/types/studio";
import { KnowledgePanel } from "./panels/knowledge-panel";
import { ScriptEditorPanel } from "./panels/script-editor-panel";
import { AssistantPanel } from "./panels/assistant-panel";
import { StoryboardPanel } from "./panels/storyboard-panel";
import { ProductionPanel } from "./panels/production-panel";
import { ThumbnailPanel } from "./panels/thumbnail-panel";
import { ExportPanel } from "./panels/export-panel";
import { VersionsPanel } from "./panels/versions-panel";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { FileText, Library, Clapperboard, FileJson, Image as ImageIcon, History, Sparkles, Download, X } from "lucide-react";

interface StudioWorkspaceProps {
  libraryItems: any[];
}

const DEFAULT_PROJECT: StudioProject = {
  id: crypto.randomUUID(),
  title: "Untitled Script",
  sections: [
    { id: crypto.randomUUID(), type: "Title", content: "", isExpanded: true },
    { id: crypto.randomUUID(), type: "Hook", content: "", isExpanded: true },
    { id: crypto.randomUUID(), type: "Intro", content: "", isExpanded: true },
    { id: crypto.randomUUID(), type: "Main Body", content: "", isExpanded: true },
    { id: crypto.randomUUID(), type: "CTA", content: "", isExpanded: true },
  ],
  research: { notes: "", sources: [], collections: [], references: "", competitors: "", timeline: "" },
  updatedAt: new Date().toISOString(),
};

const WORKFLOW_MODULES = [
  { id: "script", label: "Script Editor", icon: FileText, desc: "Write and improve your script." },
  { id: "storyboard", label: "Storyboard", icon: Clapperboard, desc: "Plan every scene visually." },
  { id: "production", label: "Production", icon: FileJson, desc: "Generate titles, publishing assets and metadata." },
  { id: "thumbnail", label: "Thumbnail AI", icon: ImageIcon, desc: "Generate professional AI-ready thumbnail prompts." },
  { id: "export", label: "Export", icon: Download, desc: "Export production packages." },
];

const TOOL_MODULES = [
  { id: "research", label: "Library", icon: Library, desc: "Research and knowledge base." },
  { id: "versions", label: "Version History", icon: History, desc: "Restore previous drafts." },
  { id: "assistant", label: "AI Assistant", icon: Sparkles, desc: "Chat with the AI." },
];

export function StudioWorkspace({ libraryItems }: StudioWorkspaceProps) {
  const [project, setProject] = useState<StudioProject>(DEFAULT_PROJECT);
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Max 3 active modules
  const [activeModules, setActiveModules] = useState<string[]>(["script", "storyboard", "assistant"]);

  // Debounced auto-save
  const debouncedProject = useDebounce(project, 3000);

  // Load initial draft on mount
  useEffect(() => {
    setMounted(true);
    const loadDraft = async () => {
      try {
        const res = await fetch("/api/studio/load");
        const data = await res.json();
        
        let loadedProject = data.project;
        if (typeof loadedProject === "string") {
          try {
            loadedProject = JSON.parse(loadedProject);
          } catch (e) {
            console.error("Failed to parse project JSON");
          }
        }
        
        if (loadedProject && Array.isArray(loadedProject.sections)) {
          setProject(loadedProject);
          toast.success("Draft recovered successfully.");
        }
      } catch (err) {
        console.error("Failed to load draft", err);
      }
    };
    loadDraft();
  }, []);

  useEffect(() => {
    if (debouncedProject.id === DEFAULT_PROJECT.id && debouncedProject.sections[0].content === "") {
      return; // skip initial empty save
    }
    const saveToDb = async () => {
      setIsSaving(true);
      try {
        await fetch("/api/studio/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project: debouncedProject })
        });
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setIsSaving(false);
      }
    };
    saveToDb();
  }, [debouncedProject]);

  const updateSection = useCallback((sectionId: string, updates: Partial<ScriptSection>) => {
    setProject(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, ...updates } : s),
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const addSection = useCallback((type: string, index: number) => {
    setProject(prev => {
      const newSections = [...prev.sections];
      newSections.splice(index, 0, { id: crypto.randomUUID(), type, content: "", isExpanded: true });
      return { ...prev, sections: newSections, updatedAt: new Date().toISOString() };
    });
  }, []);

  const removeSection = useCallback((sectionId: string) => {
    setProject(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
      updatedAt: new Date().toISOString()
    }));
  }, []);

  const reorderSections = useCallback((startIndex: number, endIndex: number) => {
    setProject(prev => {
      const newSections = Array.from(prev.sections);
      const [removed] = newSections.splice(startIndex, 1);
      newSections.splice(endIndex, 0, removed);
      return { ...prev, sections: newSections, updatedAt: new Date().toISOString() };
    });
  }, []);

  const insertFromLibrary = useCallback((content: string, type: string) => {
    setProject(prev => {
      const existingEmptyIndex = prev.sections.findIndex(s => s.type.toLowerCase().includes(type.toLowerCase()) && !s.content.trim());
      const newSections = [...prev.sections];
      if (existingEmptyIndex !== -1) {
        newSections[existingEmptyIndex] = { ...newSections[existingEmptyIndex], content };
      } else {
        newSections.push({ id: crypto.randomUUID(), type, content, isExpanded: true });
      }
      return { ...prev, sections: newSections, updatedAt: new Date().toISOString() };
    });
    toast.success(`Inserted ${type} from Library`);
  }, []);

  const toggleModule = (id: string) => {
    setActiveModules(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Don't close the last panel
        return prev.filter(m => m !== id);
      }
      if (prev.length >= 3) {
        // Replace the last panel if we already have 3
        return [...prev.slice(0, 2), id];
      }
      return [...prev, id];
    });
  };

  const renderModule = (id: string) => {
    switch (id) {
      case "script":
        return <ScriptEditorPanel project={project} updateSection={updateSection} addSection={addSection} removeSection={removeSection} reorderSections={reorderSections} setProject={setProject} isSaving={isSaving} />;
      case "research":
        return <KnowledgePanel libraryItems={libraryItems} onInsert={insertFromLibrary} />;
      case "storyboard":
        return <StoryboardPanel project={project} updateSection={updateSection} reorderSections={reorderSections} setProject={setProject} />;
      case "production":
        return <ProductionPanel project={project} setProject={setProject} />;
      case "thumbnail":
        return <ThumbnailPanel project={project} setProject={setProject} />;
      case "versions":
        return <VersionsPanel project={project} setProject={setProject} />;
      case "assistant":
        return <AssistantPanel project={project} setProject={setProject} />;
      case "export":
        return <ExportPanel project={project} />;
      default:
        return null;
    }
  };

const ALL_MODULES = [...WORKFLOW_MODULES, ...TOOL_MODULES];

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background">
      {/* Global Header */}
      <header className="h-14 border-b border-border bg-card flex items-center px-6 gap-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <span className="text-xs font-black text-primary-foreground">Y</span>
          </div>
          <span className="font-black text-base tracking-tight">YVIE</span>
          <span className="text-xs text-muted-foreground font-mono ml-1">Creator Studio</span>
        </div>
        <nav className="flex items-center gap-1 ml-auto">
          <a href="/dashboard" className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">Dashboard</a>
          <a href="/wizard" className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">Wizard AI</a>
          <a href="/studio" className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md">Creator Studio</a>
          <a href="/script-prompt-generator" className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors">Prompt Generator</a>
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden w-full">
        {/* Left Global Sidebar for Creator Studio */}
        <div className="w-72 flex-shrink-0 border-r bg-muted/10 flex flex-col py-6 overflow-y-auto">
          <div className="px-4 mb-4">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Workflow</h3>
          </div>
          <div className="flex flex-col space-y-2 px-3">
            {WORKFLOW_MODULES.map((m, idx) => {
              const isActive = activeModules.includes(m.id);
              return (
                <div key={m.id} className="relative group">
                  {/* Visual Workflow Line */}
                  {idx < WORKFLOW_MODULES.length - 1 && (
                    <div className="absolute left-6 top-10 bottom-[-8px] w-0.5 bg-border z-0" />
                  )}
                  <button
                    onClick={() => toggleModule(m.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all relative z-10 border ${
                      isActive 
                        ? "bg-card border-primary shadow-sm ring-1 ring-primary/20" 
                        : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-md transition-colors ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"}`}>
                        <m.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>{m.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {m.desc}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="px-4 mb-4 mt-8">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Tools</h3>
          </div>
          <div className="flex flex-col space-y-2 px-3">
            {TOOL_MODULES.map((m) => {
              const isActive = activeModules.includes(m.id);
              return (
                <button
                  key={m.id}
                  onClick={() => toggleModule(m.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all relative z-10 border ${
                    isActive 
                      ? "bg-card border-primary shadow-sm ring-1 ring-primary/20" 
                      : "bg-transparent border-transparent hover:bg-muted/50 hover:border-border"
                  }`}
                >
                  <div className="flex items-start gap-3 group">
                    <div className={`mt-0.5 p-1.5 rounded-md transition-colors ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:text-foreground"}`}>
                      <m.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`text-sm font-semibold ${isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>{m.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {m.desc}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Flexible Workspace Area */}
        <div className="flex-1 flex overflow-hidden bg-[#F8F9FA]">
          {mounted && (
            <ResizablePanelGroup direction="horizontal" className="h-full w-full rounded-none border-0">
              {activeModules.flatMap((moduleId, index) => {
                const mod = ALL_MODULES.find(m => m.id === moduleId);
                const panel = (
                    <ResizablePanel key={`${moduleId}-panel`} defaultSize={100 / activeModules.length} minSize={20}>
                      <div className="h-full flex flex-col border-r border-border/50 shadow-sm bg-background last:border-r-0 m-2 rounded-xl overflow-hidden ring-1 ring-border/50">
                        {/* Panel Header */}
                        <div className="h-12 border-b flex items-center justify-between px-4 bg-card shrink-0">
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            {mod && React.createElement(mod.icon, { className: "w-4 h-4 text-primary" })}
                            {mod?.label || moduleId}
                          </div>
                          <button 
                            onClick={() => toggleModule(moduleId)}
                            className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors"
                            disabled={activeModules.length === 1}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        {/* Panel Content */}
                        <div className="flex-1 overflow-hidden relative bg-background">
                          {renderModule(moduleId)}
                        </div>
                      </div>
                    </ResizablePanel>
                );
                
                if (index < activeModules.length - 1) {
                  return [
                    panel,
                    <ResizableHandle key={`${moduleId}-handle`} withHandle className="w-2 bg-transparent" />
                  ];
                }
                
                return [panel];
              })}
            </ResizablePanelGroup>
          )}
        </div>
      </div>
    </div>
  );
}
