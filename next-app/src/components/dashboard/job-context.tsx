"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type BackgroundJobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED" | "RETRYING";

export interface BackgroundJob {
  id: string;
  name: string;
  status: BackgroundJobStatus;
  progress: number; // 0-100
  estimatedTimeRemaining?: string;
  error?: string;
}

interface JobContextType {
  jobs: BackgroundJob[];
  queueJob: (job: Omit<BackgroundJob, "status" | "progress">) => void;
  updateJob: (id: string, updates: Partial<BackgroundJob>) => void;
  cancelJob: (id: string) => void;
  retryJob: (id: string) => void;
}

const JobContext = createContext<JobContextType | undefined>(undefined);

export function JobProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);

  const queueJob = (job: Omit<BackgroundJob, "status" | "progress">) => {
    setJobs(prev => [...prev, { ...job, status: "QUEUED", progress: 0 }]);
  };

  const updateJob = (id: string, updates: Partial<BackgroundJob>) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...updates } : j));
  };

  const cancelJob = (id: string) => {
    updateJob(id, { status: "CANCELLED" });
  };

  const retryJob = (id: string) => {
    updateJob(id, { status: "RETRYING", progress: 0 });
  };

  return (
    <JobContext.Provider value={{ jobs, queueJob, updateJob, cancelJob, retryJob }}>
      {children}
    </JobContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error("useJobs must be used within a JobProvider");
  }
  return context;
}
