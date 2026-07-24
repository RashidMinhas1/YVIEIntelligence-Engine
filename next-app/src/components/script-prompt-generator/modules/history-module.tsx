"use client";

import React from "react";
import { useGenerator } from "../generator-context";
import { History, Clock, SaveAll } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HistoryModule() {
  const { project } = useGenerator();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            History & Recovery
          </h2>
          <p className="text-muted-foreground text-sm mt-1">Manage project auto-saves and restore previous versions.</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border shadow-sm p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b">
          <div>
            <h3 className="font-bold">Current Session</h3>
            <p className="text-sm text-muted-foreground">Auto-save is active.</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">Last updated</p>
            <p className="text-xs text-muted-foreground font-mono">{new Date(project.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        <div>
          <h3 className="font-bold mb-4 flex items-center gap-2"><SaveAll className="w-4 h-4" /> Auto-Saved Drafts</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-bold text-sm">Draft - {project.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(project.updatedAt).toLocaleString()} • Browser LocalStorage</p>
                </div>
              </div>
              <Button variant="outline" size="sm" disabled>Current</Button>
            </div>
            
            {/* Mock previous draft */}
            <div className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-bold text-sm">Draft - Initial Setup</p>
                  <p className="text-xs text-muted-foreground">Yesterday, 4:30 PM • Browser LocalStorage</p>
                </div>
              </div>
              <Button variant="outline" size="sm">Restore</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
