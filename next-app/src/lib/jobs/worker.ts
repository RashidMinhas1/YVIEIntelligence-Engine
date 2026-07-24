import { JobRepository } from "./repository";

export type JobHandler = (
  jobId: string, 
  payload: any, 
  updateProgress: (progress: number, currentStep: string) => Promise<void>
) => Promise<any>;

const registry: Record<string, JobHandler> = {};

export function registerJobHandler(type: string, handler: JobHandler) {
  registry[type] = handler;
}

export async function executeJob(jobId: string, type: string, payload: any, attempt: number = 0) {
  const handler = registry[type];
  
  if (!handler) {
    await JobRepository.updateJob(jobId, {
      status: "failed",
      error: `No handler registered for job type: ${type}`,
      finishedAt: new Date(),
    });
    return;
  }

  await JobRepository.updateJob(jobId, {
    status: "running",
    startedAt: attempt === 0 ? new Date() : undefined, // keep original start time on retries
    progress: attempt > 0 ? 0 : 10,
    currentStep: attempt > 0 ? `Retrying (Attempt ${attempt + 1})...` : "Initializing job...",
    retryCount: attempt
  });

  try {
    const updateProgress = async (progress: number, currentStep: string) => {
      const currentJob = await JobRepository.getJob(jobId);
      if (currentJob?.status === "cancelled") {
        throw new Error("Job was cancelled by the user");
      }
      await JobRepository.updateJob(jobId, { progress, currentStep });
    };

    // Timeout Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Job execution timed out after 5 minutes")), 300000);
    });

    const result = await Promise.race([
      handler(jobId, payload, updateProgress),
      timeoutPromise
    ]);
    
    await JobRepository.updateJob(jobId, {
      status: "completed",
      progress: 100,
      currentStep: "Finished",
      result,
      finishedAt: new Date(),
    });

  } catch (error: any) {
    console.error(`[Worker] Job ${jobId} failed (Attempt ${attempt + 1}):`, error);
    
    const currentJob = await JobRepository.getJob(jobId);
    if (currentJob?.status === "cancelled") {
      return;
    }

    const maxRetries = 2;
    // Don't retry if it's an AI timeout — the AI provider already retried internally.
    // Retrying at job level would multiply the wait time by 2-3x.
    const isAITimeout = error.message?.includes("Timeout") || error.message?.includes("TIMEOUT") || error.message?.includes("aborted") || error.message?.includes("timed out");
    if (attempt < maxRetries && !error.message?.includes("cancelled") && !isAITimeout) {
      const backoffMs = Math.pow(2, attempt) * 2000; // 2s, 4s...
      await JobRepository.updateJob(jobId, {
        currentStep: `Failed. Retrying in ${backoffMs/1000}s...`,
        error: error.message,
      });
      
      setTimeout(() => {
        executeJob(jobId, type, payload, attempt + 1).catch(console.error);
      }, backoffMs);
      return;
    }

    await JobRepository.updateJob(jobId, {
      status: "failed",
      error: error.message || "An unknown error occurred",
      finishedAt: new Date(),
    });
  }
}
