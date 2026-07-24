"use client";

import React, { useState } from "react";
import { useGenerator } from "../generator-context";
import { Library, Folder, Search, Star, Trash2, Copy, Play } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function PromptLibraryModule() {
  const { project } = useGenerator();
  const [searchQuery, setSearchQuery] = useState("");

  const savedPrompts = [
    { id: "1", title: "Cinematic Drone Intro", type: "Camera", folder: "Intros", date: "2026-07-10" },
    { id: "2", title: "Tense Interview Setup", type: "Lighting", folder: "Documentary", date: "2026-07-12" },
    { id: "3", title: "Cyberpunk Cityscape", type: "Environment", folder: "Sci-Fi", date: "2026-07-14" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Library className="w-6 h-6 text-primary" />
            Prompt Library
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Organize, save, and reuse your best prompts.</p>
        </div>
      </div>

      <div className="flex gap-6 h-[600px]">
        {/* Folders sidebar */}
        <div className="w-48 border-r pr-4 space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
            Folders
            <Button variant="ghost" size="icon" className="w-4 h-4"><PlusIcon className="w-3 h-3" /></Button>
          </div>
          <div className="space-y-1">
            <button className="w-full text-left px-2 py-1.5 bg-muted/50 text-sm font-medium rounded text-foreground flex items-center gap-2">
              <Folder className="w-4 h-4 text-primary" /> All Prompts
            </button>
            <button className="w-full text-left px-2 py-1.5 text-muted-foreground hover:bg-muted/50 text-sm font-medium rounded flex items-center gap-2 transition-colors">
              <Star className="w-4 h-4 text-yellow-500" /> Favorites
            </button>
            <button className="w-full text-left px-2 py-1.5 text-muted-foreground hover:bg-muted/50 text-sm font-medium rounded flex items-center gap-2 transition-colors">
              <Folder className="w-4 h-4" /> Intros
            </button>
            <button className="w-full text-left px-2 py-1.5 text-muted-foreground hover:bg-muted/50 text-sm font-medium rounded flex items-center gap-2 transition-colors">
              <Folder className="w-4 h-4" /> Documentary
            </button>
            <button className="w-full text-left px-2 py-1.5 text-muted-foreground hover:bg-muted/50 text-sm font-medium rounded flex items-center gap-2 transition-colors">
              <Folder className="w-4 h-4" /> Sci-Fi
            </button>
          </div>
        </div>

        {/* Main List */}
        <div className="flex-1 flex flex-col space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search prompts..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {savedPrompts.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg bg-card hover:border-primary/50 transition-colors group cursor-pointer">
                <div>
                  <h4 className="font-bold text-sm">{p.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{p.type}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Folder className="w-3 h-3" /> {p.folder}</span>
                    <span className="text-xs text-muted-foreground opacity-50">{p.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="w-8 h-8"><Play className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => toast.success("Copied")}><Copy className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  );
}
