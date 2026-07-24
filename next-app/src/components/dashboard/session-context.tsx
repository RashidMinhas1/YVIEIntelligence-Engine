"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { ResearchSession } from "@/lib/repositories/storage";

interface SessionContextType {
  activeSession: ResearchSession | null;
  setActiveSession: (session: ResearchSession | null) => void;
  sessions: ResearchSession[];
  refreshSessions: () => Promise<void>;
  createSession: (name: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [activeSession, setActiveSession] = useState<ResearchSession | null>(null);
  const [sessions, setSessions] = useState<ResearchSession[]>([]);

  const refreshSessions = async () => {
    // In a real implementation this would call an API or Server Action
    // For now, since storage is server-side and we're client-side, 
    // we would typically use React Query to fetch this from an API route.
    // For Pre-Phase 1 boilerplate, we'll just leave it empty until the API is wired.
  };

  const createSession = async (name: string) => {
    // API call here
    await refreshSessions();
  };

  useEffect(() => {
    refreshSessions();
  }, []);

  return (
    <SessionContext.Provider value={{ activeSession, setActiveSession, sessions, refreshSessions, createSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}
