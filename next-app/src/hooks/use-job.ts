import { useState, useEffect, useRef, useCallback } from "react";
import { Job } from "@/db/schema/jobs";

interface UseJobOptions {
  pollIntervalMs?: number;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export function useJob(initialJobId: string | null = null, options: UseJobOptions = {}) {
  const [jobId, setJobId] = useState<string | null>(initialJobId);
  const [job, setJob] = useState<Job | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Refs to avoid stale closures
  const onCompleteRef = useRef(options.onComplete);
  const onErrorRef = useRef(options.onError);
  const pollIntervalRef = useRef(options.pollIntervalMs ?? 2000);
  // Keep a live ref to the current jobId so the recursive poll sees the latest value
  const jobIdRef = useRef<string | null>(initialJobId);
  const isPollingRef = useRef(false);

  // Sync option refs on every render so callbacks always have fresh closures
  useEffect(() => { onCompleteRef.current = options.onComplete; });
  useEffect(() => { onErrorRef.current = options.onError; });
  useEffect(() => { pollIntervalRef.current = options.pollIntervalMs ?? 2000; });

  const clearTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    setIsPolling(false);
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(() => {
    stopPolling();
    jobIdRef.current = null;
    setJobId(null);
    setJob(null);
  }, [stopPolling]);

  // Core poll function — uses refs not state to avoid stale closures
  const doPoll = useCallback(async () => {
    const id = jobIdRef.current;
    if (!id || !isPollingRef.current) return;

    try {
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) {
        // retry on network error
        pollTimerRef.current = setTimeout(doPoll, pollIntervalRef.current);
        return;
      }
      const data = await res.json();
      const currentJob = data.job as Job;
      setJob(currentJob);

      if (!isPollingRef.current) return; // was stopped while awaiting fetch

      if (currentJob.status === "completed") {
        isPollingRef.current = false;
        setIsPolling(false);
        clearTimer();
        // Call onComplete AFTER state is settled — use microtask queue
        const result = currentJob.result;
        Promise.resolve().then(() => {
          onCompleteRef.current?.(result);
        });
      } else if (currentJob.status === "failed") {
        isPollingRef.current = false;
        setIsPolling(false);
        clearTimer();
        const err = currentJob.error || "Unknown error";
        Promise.resolve().then(() => {
          onErrorRef.current?.(err);
        });
      } else if (currentJob.status === "cancelled") {
        isPollingRef.current = false;
        setIsPolling(false);
        clearTimer();
      } else {
        // Still running — schedule next poll
        pollTimerRef.current = setTimeout(doPoll, pollIntervalRef.current);
      }
    } catch (err) {
      console.error("[useJob] poll error:", err);
      if (isPollingRef.current) {
        pollTimerRef.current = setTimeout(doPoll, pollIntervalRef.current);
      }
    }
  }, [clearTimer]);

  const startPolling = useCallback((id: string) => {
    clearTimer();
    jobIdRef.current = id;
    setJobId(id);
    isPollingRef.current = true;
    setIsPolling(true);
    // Kick off immediately
    doPoll();
  }, [clearTimer, doPoll]);

  const cancelJob = useCallback(async () => {
    const id = jobIdRef.current;
    if (!id) return;
    stopPolling();
    try {
      await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      setJob(prev => prev ? { ...prev, status: "cancelled", currentStep: "Cancelled by user" } : null);
    } catch (err) {
      console.error("Failed to cancel job", err);
    }
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => () => { isPollingRef.current = false; clearTimer(); }, [clearTimer]);

  return { jobId, job, isPolling, startPolling, stopPolling, cancelJob, reset };
}
