"use client";

import React from "react";
import { StudioProject } from "@/lib/types/studio";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileJson, FileText } from "lucide-react";
import { toast } from "sonner";

interface ExportPanelProps {
  project: StudioProject;
}

export function ExportPanel({ project }: ExportPanelProps) {
  const handleExport = async (format: "md" | "txt" | "json" | "docx" | "pdf") => {
    if (format === "pdf") {
      try {
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF();
        let y = 20;
        
        doc.setFontSize(16);
        doc.text(`Production Package: ${project.title || "Untitled"}`, 20, y);
        y += 10;
        
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, y);
        y += 15;

        const prod = project.production || { thumbnails: [], titles: [], chapters: [], editingChecklist: [] };
        
        if (prod.titles && prod.titles.length > 0) {
          doc.setFontSize(14);
          doc.text("Titles", 20, y);
          y += 8;
          doc.setFontSize(11);
          prod.titles.forEach(t => {
            doc.text(`• ${t.title} (SEO: ${t.seoScore})`, 25, y);
            y += 6;
            if (y > 280) { doc.addPage(); y = 20; }
          });
          y += 10;
        }

        if (prod.thumbnails && prod.thumbnails.length > 0) {
          doc.setFontSize(14);
          doc.text("Thumbnails", 20, y);
          y += 8;
          doc.setFontSize(11);
          prod.thumbnails.forEach(t => {
            doc.text(`Concept: ${t.title}`, 20, y);
            y += 6;
            doc.text(`• Hook: ${t.visualHook}`, 25, y);
            y += 6;
            doc.text(`• Subject: ${t.mainSubject}`, 25, y);
            y += 6;
            if (t.imagePrompt) {
              const lines = doc.splitTextToSize(`• Prompt: ${t.imagePrompt}`, 170);
              doc.text(lines, 25, y);
              y += (lines.length * 5) + 2;
            }
            y += 4;
            if (y > 270) { doc.addPage(); y = 20; }
          });
        }

        doc.save(`${project.title?.replace(/\s+/g, '_') || 'project'}_production.pdf`);
        toast.success("Exported as PDF");
        return;
      } catch (err) {
        console.error(err);
        toast.error("Failed to export PDF");
        return;
      }
    }

    if (format === "docx") {
      try {
        const docx = await import("docx");
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

        const prod = project.production || { thumbnails: [], titles: [], chapters: [], editingChecklist: [] };
        
        const docChildren: any[] = [
          new Paragraph({ text: `Production Package: ${project.title || "Untitled"}`, heading: HeadingLevel.TITLE, spacing: { after: 400 } }),
          new Paragraph({ text: `Generated on: ${new Date().toLocaleDateString()}`, spacing: { after: 800 } })
        ];

        if (prod.titles && prod.titles.length > 0) {
          docChildren.push(new Paragraph({ text: "Titles", heading: HeadingLevel.HEADING_1 }));
          prod.titles.forEach(t => {
             docChildren.push(new Paragraph({ text: `${t.title} (SEO: ${t.seoScore}, Click: ${t.clickPotential})`, bullet: { level: 0 } }));
          });
          docChildren.push(new Paragraph({ text: "", spacing: { after: 400 } }));
        }

        if (prod.description) {
           docChildren.push(new Paragraph({ text: "Description", heading: HeadingLevel.HEADING_1 }));
           docChildren.push(new Paragraph({ text: prod.description.full || "", spacing: { after: 400 } }));
        }

        if (prod.thumbnails && prod.thumbnails.length > 0) {
           docChildren.push(new Paragraph({ text: "Thumbnails", heading: HeadingLevel.HEADING_1 }));
           prod.thumbnails.forEach(t => {
             docChildren.push(new Paragraph({ text: `Concept: ${t.title}`, heading: HeadingLevel.HEADING_2 }));
             docChildren.push(new Paragraph({ text: `Hook: ${t.visualHook}`, bullet: { level: 0 } }));
             docChildren.push(new Paragraph({ text: `Subject: ${t.mainSubject}`, bullet: { level: 0 } }));
             if (t.imagePrompt) {
               docChildren.push(new Paragraph({ text: `AI Image Prompt: ${t.imagePrompt}`, bullet: { level: 0 } }));
             }
             docChildren.push(new Paragraph({ text: "", spacing: { after: 200 } }));
           });
        }

        const doc = new Document({ sections: [{ properties: {}, children: docChildren }] });
        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${project.title?.replace(/\s+/g, '_') || 'project'}_production.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Exported as DOCX");
        return;
      } catch (err) {
        console.error(err);
        toast.error("Failed to export DOCX");
        return;
      }
    }

    let data = "";
    if (format === "json") {
      data = JSON.stringify(project.production || {}, null, 2);
    } else {
      const prod = project.production || { thumbnails: [], titles: [], chapters: [], editingChecklist: [] };
      const lines: string[] = [];
      lines.push(`# Production Package: ${project.title}`);
      lines.push("");
      
      lines.push("## Titles");
      prod.titles?.forEach(t => lines.push(`- ${t.title} (SEO: ${t.seoScore}, Click: ${t.clickPotential})`));
      lines.push("");

      if (prod.description) {
        lines.push("## Description");
        lines.push(prod.description.full);
        lines.push("");
      }

      if (prod.thumbnails && prod.thumbnails.length > 0) {
        lines.push("## Thumbnails");
        prod.thumbnails.forEach(t => {
          lines.push(`### Concept: ${t.title}`);
          lines.push(`- Hook: ${t.visualHook}`);
          lines.push(`- Subject: ${t.mainSubject}`);
          if (t.imagePrompt) {
            lines.push(`- AI Image Prompt: ${t.imagePrompt}`);
            lines.push(`- Negative Prompt: ${t.negativePrompt || "N/A"}`);
            lines.push(`- Style: ${t.style || "N/A"}`);
            lines.push(`- Aspect Ratio: ${t.aspectRatio || "16:9"}`);
            lines.push(`- Preview URL: ${t.generatedImageUrl || "Not generated"}`);
          }
          if (t.readinessScore) {
            lines.push(`- Readiness Score: ${t.readinessScore.overallScore}/100`);
          }
          lines.push("");
        });
      }

      data = lines.join("\n");
    }

    const blob = new Blob([data], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.title.replace(/\s+/g, '_')}_production.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported as .${format}`);
  };

  return (
    <div className="flex flex-col h-full bg-background border-r">
      <div className="p-4 border-b border-border/40 flex justify-between items-center bg-card shadow-sm shrink-0">
        <div>
          <h2 className="font-bold text-xl flex items-center gap-2"><Download className="w-5 h-5 text-primary"/> Export Center</h2>
          <p className="text-sm text-muted-foreground mt-1">Download your script, storyboard, and production assets.</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6 md:p-8 bg-muted/10">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button variant="outline" className="h-40 flex flex-col gap-4 border border-border/60 rounded-3xl bg-card shadow-sm hover:shadow-md hover:border-primary/40 transition-all group" onClick={() => handleExport("md")}>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">Markdown Package</span>
                <span className="text-xs text-muted-foreground mt-1 font-medium">Ideal for Notion & Obsidian</span>
              </div>
            </Button>
            <Button variant="outline" className="h-40 flex flex-col gap-4 border border-border/60 rounded-3xl bg-card shadow-sm hover:shadow-md hover:border-muted-foreground/40 transition-all group" onClick={() => handleExport("txt")}>
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">Plain Text</span>
                <span className="text-xs text-muted-foreground mt-1 font-medium">Simple text document</span>
              </div>
            </Button>
            <Button variant="outline" className="h-40 flex flex-col gap-4 border border-border/60 rounded-3xl bg-card shadow-sm hover:shadow-md hover:border-blue-500/40 transition-all group" onClick={() => handleExport("json")}>
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileJson className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">Raw JSON</span>
                <span className="text-xs text-muted-foreground mt-1 font-medium">For developers & APIs</span>
              </div>
            </Button>
            <Button variant="outline" className="h-40 flex flex-col gap-4 border border-border/60 rounded-3xl bg-card shadow-sm hover:shadow-md hover:border-purple-500/40 transition-all group" onClick={() => handleExport("docx")}>
              <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">Microsoft Word</span>
                <span className="text-xs text-muted-foreground mt-1 font-medium">Standard DOCX format</span>
              </div>
            </Button>
            <Button variant="outline" className="h-40 flex flex-col gap-4 border border-border/60 rounded-3xl bg-card shadow-sm hover:shadow-md hover:border-red-500/40 transition-all group" onClick={() => handleExport("pdf")}>
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-red-500" />
              </div>
              <div className="flex flex-col items-center">
                <span className="font-bold text-base text-foreground">PDF Document</span>
                <span className="text-xs text-muted-foreground mt-1 font-medium">Standard PDF format</span>
              </div>
            </Button>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
