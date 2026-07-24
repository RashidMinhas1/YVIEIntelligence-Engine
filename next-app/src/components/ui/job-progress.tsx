"use client";

import React, { useEffect, useState } from "react";
import { Job } from "@/db/schema/jobs";

interface JobProgressProps {
  job: Job | null;
  onCancel?: () => void;
  onRetry?: () => void;
  title?: string;
}

export function JobProgress({ job, onCancel, onRetry, title = "Processing..." }: JobProgressProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!job || job.status !== "running") return;
    setElapsed(0);
    const interval = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [job?.status, job?.id]);

  if (!job) return null;

  const isError = job.status === "failed";
  const isComplete = job.status === "completed";
  const isCancelled = job.status === "cancelled";
  const isRunning = job.status === "running";

  const isTimeoutError = job.error?.toLowerCase().includes("timeout") || job.error?.toLowerCase().includes("aborted");

  const formatElapsed = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div className="w-full bg-slate-900 rounded-xl p-6 border border-white/10 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-white font-semibold flex items-center gap-2">
            {isRunning && (
              <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isComplete && <span className="text-green-500">✓</span>}
            {isError && <span className="text-red-500">✗</span>}
            {isCancelled && <span className="text-yellow-500">⚠</span>}
            {title}
            {isRunning && elapsed > 0 && (
              <span className="text-xs text-slate-400 font-normal ml-1">{formatElapsed(elapsed)}</span>
            )}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {job.currentStep || "Starting up..."}
          </p>
        </div>
        
        {isRunning && onCancel && (
          <button 
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {!isError && !isCancelled && (
        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ease-out ${isComplete ? 'bg-green-500' : 'bg-primary'}`}
            style={{ width: `${Math.max(5, job.progress || 0)}%` }}
          />
        </div>
      )}

      {isError && (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-4 text-sm text-red-400 space-y-2">
          <p className="font-medium">
            {isTimeoutError ? "⏱ AI Provider Timed Out" : "Execution Failed"}
          </p>
          {isTimeoutError ? (
            <div className="opacity-80 space-y-1 text-xs">
              <p>The AI provider took too long to respond. This usually means:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>The selected model is under heavy load</li>
                <li>Your OpenRouter API key may have usage limits</li>
                <li>Try switching to a faster model in AI Settings</li>
              </ul>
            </div>
          ) : (
            <p className="opacity-80 break-words text-xs">{job.error}</p>
          )}
          {onRetry && (
            <button 
              onClick={onRetry}
              className="mt-1 text-xs bg-red-500 text-white px-3 py-1.5 rounded hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      )}
      
      {isCancelled && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-4 text-sm text-yellow-400">
          Job was cancelled by the user.
        </div>
      )}
    </div>
  );
}
