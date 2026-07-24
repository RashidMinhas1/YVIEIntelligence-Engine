"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SelectionContextType {
  selectedChannelId: string | null;
  setSelectedChannelId: (id: string | null) => void;
  selectedVideoId: string | null;
  setSelectedVideoId: (id: string | null) => void;
  selectedReportId: string | null;
  setSelectedReportId: (id: string | null) => void;
  clearSelection: () => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export function SelectionProvider({ children }: { children: ReactNode }) {
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const clearSelection = () => {
    setSelectedChannelId(null);
    setSelectedVideoId(null);
    setSelectedReportId(null);
  };

  return (
    <SelectionContext.Provider value={{
      selectedChannelId,
      setSelectedChannelId,
      selectedVideoId,
      setSelectedVideoId,
      selectedReportId,
      setSelectedReportId,
      clearSelection
    }}>
      {children}
    </SelectionContext.Provider>
  );
}

export function useSelection() {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error("useSelection must be used within a SelectionProvider");
  }
  return context;
}
