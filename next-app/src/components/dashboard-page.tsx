"use client";

import { useState, useMemo } from "react";
import { DashboardModuleId, getRegisteredModules } from "./dashboard/registry";
import { SessionProvider } from "./dashboard/session-context";
import { SelectionProvider } from "./dashboard/selection-context";
import { JobProvider } from "./dashboard/job-context";
import { workspaceEvents } from "./dashboard/events";
import { useEffect } from "react";

export default function DashboardShell() {
  const [activeModuleId, setActiveModuleId] = useState<DashboardModuleId>("overview");

  useEffect(() => {
    return workspaceEvents.subscribe("navigate", (moduleId: string) => {
      setActiveModuleId(moduleId as DashboardModuleId);
    });
  }, []);

  const registeredModules = useMemo(() => getRegisteredModules(), []);
  const ActiveModule = registeredModules.find((m) => m.id === activeModuleId)?.component;

  return (
    <SessionProvider>
      <SelectionProvider>
        <JobProvider>
          <div className="flex min-h-[calc(100vh-4rem)] border-t border-border mt-16">
        {/* Sidebar Plugin Navigation */}
        <aside className="w-64 border-r border-border bg-card/30 p-4 space-y-2 hidden md:block">
          <div className="mb-6 px-2">
            <h3 className="text-xs font-mono uppercase text-muted-foreground tracking-wider mb-2">
              Research Workspace
            </h3>
            {/* Future: Session Selector Dropdown goes here */}
            <div className="p-2 bg-secondary/50 rounded text-sm border border-border">
              Default Session
            </div>
          </div>
          
          <nav className="space-y-1">
            {registeredModules.map((module) => {
              const Icon = module.icon;
              const isActive = activeModuleId === module.id;
              return (
                <button
                  key={module.id}
                  onClick={() => setActiveModuleId(module.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {module.title}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Dynamic Module Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          {ActiveModule ? <ActiveModule /> : <div className="text-muted-foreground">Module not found</div>}
        </main>
      </div>
        </JobProvider>
      </SelectionProvider>
    </SessionProvider>
  );
}
