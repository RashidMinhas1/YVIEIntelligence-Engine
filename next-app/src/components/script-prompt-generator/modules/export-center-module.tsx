"use client";

import React from "react";
import { useGenerator } from "../generator-context";
import { Download, FileJson, FileText, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function ExportCenterModule() {
  const { project } = useGenerator();

  const handleExport = (format: "json" | "txt" | "md") => {
    try {
      let content = "";
      let filename = `${project.title.replace(/\s+/g, '_').toLowerCase()}_prompts.${format}`;
      let type = "text/plain";

      if (format === "json") {
        content = JSON.stringify(project, null, 2);
        type = "application/json";
      } else if (format === "md") {
        content = `# ${project.title}\n\n## Settings\nStyle: ${project.settings.style}\nCamera: ${project.settings.cameraStyle}\n\n`;
        project.scenes.forEach(s => {
          content += `### Scene ${s.sceneNumber}\n**Visual**: ${s.visualDescription}\n`;
          Object.entries(project.prompts[s.id] || {}).forEach(([k, v]) => {
            content += `- **${k.toUpperCase()} PROMPT**: ${v}\n`;
          });
          content += "\n";
        });
      } else {
        content = `PROJECT: ${project.title}\n\n`;
        project.scenes.forEach(s => {
          content += `SCENE ${s.sceneNumber}\nVisual: ${s.visualDescription}\n`;
          Object.entries(project.prompts[s.id] || {}).forEach(([k, v]) => {
            content += `[${k.toUpperCase()}] ${v}\n`;
          });
          content += "\n";
        });
      }

      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (e) {
      toast.error("Export failed");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Download className="w-6 h-6 text-primary" />
            Export Center
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Export your script, scene breakdown, and generated prompts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border shadow-sm p-6 text-center space-y-4 hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <FileJson className="w-6 h-6" />
          </div>
          <h3 className="font-bold">JSON Export</h3>
          <p className="text-sm text-muted-foreground">Export raw project data including all settings and scene IDs.</p>
          <Button className="w-full" variant="outline" onClick={() => handleExport("json")}>Download .json</Button>
        </div>

        <div className="bg-card rounded-xl border shadow-sm p-6 text-center space-y-4 hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <h3 className="font-bold">Markdown Export</h3>
          <p className="text-sm text-muted-foreground">Formatted Markdown file perfect for documentation.</p>
          <Button className="w-full" variant="outline" onClick={() => handleExport("md")}>Download .md</Button>
        </div>

        <div className="bg-card rounded-xl border shadow-sm p-6 text-center space-y-4 hover:border-primary/50 transition-colors">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold">Text Export</h3>
          <p className="text-sm text-muted-foreground">Plain text file for easy copying and pasting into AI tools.</p>
          <Button className="w-full" variant="outline" onClick={() => handleExport("txt")}>Download .txt</Button>
        </div>
      </div>
    </div>
  );
}
