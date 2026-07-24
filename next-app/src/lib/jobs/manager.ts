import { executeJob } from "./worker";
import { initJobs } from "./handlers";
import { JobRepository } from "./repository";

export const JobManager = {
  /**
   * Dispatches a new job and returns the jobId.
   * Runs the worker execution in the background.
   */
  async dispatch(type: string, payload: any, options?: { priority?: number }): Promise<string> {
    initJobs();
    
    const jobId = await JobRepository.createJob({
      type,
      payload,
      status: "queued",
      progress: 0,
      totalSteps: 100,
      priority: options?.priority || 0,
    });

    // Use Next.js 'after' to decouple from the request context and prevent AbortError
    try {
      const { after } = require("next/server");
      after(() => {
        JobManager.processJob(jobId, type, payload);
      });
    } catch (e) {
      // Fallback if not in a request context
      JobManager.processJob(jobId, type, payload);
    }
    return jobId;
  },

  async processJob(jobId: string, type: string, payload: any) {
    await JobRepository.updateJob(jobId, { status: "processing", startedAt: new Date() });
    executeJob(jobId, type, payload).catch(async (e) => {
      console.error(`[JobManager] Background execution failed for job ${jobId}:`, e);
      const job = await JobRepository.getJob(jobId);
      if (job && (job.retryCount || 0) < 3) {
        await JobRepository.updateJob(jobId, { status: "retry", retryCount: (job.retryCount || 0) + 1 });
        // Retry logic could be added here in a real queue via setTimeout
      } else {
        await JobRepository.updateJob(jobId, { status: "failed", error: e.message || String(e) });
      }
    });
  },

  async retryJob(id: string) {
    const job = await JobRepository.getJob(id);
    if (!job || (job.status !== "failed" && job.status !== "retry")) return;
    await JobRepository.updateJob(id, { status: "waiting" });
    JobManager.processJob(id, job.type, job.payload);
  },

  async resumeJob(id: string) {
    const job = await JobRepository.getJob(id);
    if (!job || job.status !== "cancelled") return;
    await JobRepository.updateJob(id, { status: "waiting" });
    JobManager.processJob(id, job.type, job.payload);
  },

  async getStatus(id: string) {
    return await JobRepository.getJob(id);
  },

  async cancelJob(id: string) {
    await JobRepository.updateJob(id, {
      status: "cancelled",
      finishedAt: new Date(),
    });
  },

  async updateProgress(id: string, progress: number, currentStep?: string) {
    await JobRepository.updateJob(id, { progress, currentStep });
  }
};
