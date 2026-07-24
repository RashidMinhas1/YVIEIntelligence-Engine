"use client";

import React, { useState } from "react";
import { useGenerator } from "../generator-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export function ScriptImportModule() {
  const { project, setProject, setActiveTab } = useGenerator();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Very basic local text read for TXT/MD files. 
      // For DOCX/PDF, we'd send to a parsing API endpoint in production.
      const text = await file.text();
      setProject(p => ({ ...p, rawScript: text, title: file.name.replace(/\.[^/.]+$/, "") }));
      toast.success("Script imported successfully");
    } catch (err) {
      toast.error("Failed to parse file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Import Script</h3>
            <p className="text-sm text-muted-foreground">Paste your raw script or upload a file (TXT, MD, DOCX, PDF).</p>
          </div>
          <div>
            <input type="file" id="file-upload" className="hidden" accept=".txt,.md,.docx,.pdf" onChange={handleFileUpload} />
            <Button variant="outline" onClick={() => document.getElementById("file-upload")?.click()} disabled={isUploading}>
              {isUploading ? <Upload className="w-4 h-4 mr-2 animate-bounce" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload File
            </Button>
          </div>
        </div>
        
        <Textarea 
          placeholder="Paste your script here..."
          className="min-h-[400px] font-mono text-sm resize-y bg-background"
          value={project.rawScript}
          onChange={(e) => setProject(p => ({ ...p, rawScript: e.target.value }))}
        />
        
        <div className="flex justify-end">
          <Button 
            disabled={!project.rawScript.trim()} 
            onClick={() => setActiveTab("analysis")}
            className="font-bold"
          >
            Analyze Script <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
