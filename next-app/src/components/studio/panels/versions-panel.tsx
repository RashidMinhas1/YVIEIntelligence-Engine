"use client";

import React from "react";
import { StudioProject } from "@/lib/types/studio";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface VersionsPanelProps {
  project: StudioProject;
  setProject: React.Dispatch<React.SetStateAction<StudioProject>>;
}

export function VersionsPanel({ project, setProject }: VersionsPanelProps) {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-3 border-b bg-card">
        <h2 className="font-bold text-base">Version History</h2>
        <p className="text-xs text-muted-foreground">View and restore previous auto-saves.</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <VersionHistoryList project={project} onRestore={(versionProject) => {
          if (confirm("Are you sure you want to restore this version? Your current work will be replaced.")) {
            setProject(versionProject);
            toast.success("Version restored successfully");
          }
        }} />
      </ScrollArea>
    </div>
  );
}

function VersionHistoryList({ project, onRestore }: { project: StudioProject, onRestore: (p: StudioProject) => void }) {
  const [versions, setVersions] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchVersions = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/studio/versions?parentId=${project.id}`);
        const data = await res.json();
        if (data.versions) {
          setVersions(data.versions);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVersions();
  }, [project.id, project.updatedAt]);

  if (isLoading && versions.length === 0) {
    return <div className="text-xs text-muted-foreground text-center p-4">Loading versions...</div>;
  }

  if (versions.length === 0) {
    return (
      <div className="text-xs text-muted-foreground p-4 text-center border rounded-md border-dashed">
        Auto-saves will appear here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {versions.map((v) => (
        <div key={v.id} className="border p-3 rounded-md bg-card text-xs">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-medium">Version {v.version}</div>
              <div className="text-muted-foreground">{new Date(v.updatedAt).toLocaleString()}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => onRestore(v.content)} className="h-7 text-xs">
              Restore
            </Button>
          </div>
          <div className="text-muted-foreground line-clamp-1">{v.title}</div>
        </div>
      ))}
    </div>
  );
}
