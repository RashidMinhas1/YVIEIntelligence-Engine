export enum AIJobPriority {
  CRITICAL = 0,
  INTERACTIVE = 1,
  BACKGROUND = 2,
  HEALTH_CHECK = 3,
  WARMUP = 4
}

type AIJob<T> = {
  id: string;
  priority: AIJobPriority;
  task: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: any) => void;
  abortSignal?: AbortSignal;
  isStream?: boolean;
  userId?: string;
  featureKey?: string;
};

class AIQueue {
  private queues: AIJob<any>[][] = [[], [], [], [], []];
  private running = 0;
  private runningDiscrete = 0;
  private runningStream = 0;
  private maxConcurrent = 20; // Global concurrency limit
  
  // Budget Manager state
  private maxPerUser = 5;
  private maxPerFeature = 10;
  private maxQueueSize = 100;
  
  private userRunning: Map<string, number> = new Map();
  private featureRunning: Map<string, number> = new Map();

  public setLimits(global: number, user: number, feature: number, queueMax: number) {
    this.maxConcurrent = global;
    this.maxPerUser = user;
    this.maxPerFeature = feature;
    this.maxQueueSize = queueMax;
  }

  public getQueueSize(): number {
    return this.queues.reduce((acc, q) => acc + q.length, 0);
  }
  
  public getMetrics() {
    return {
      runningTotal: this.running,
      runningDiscrete: this.runningDiscrete,
      runningStream: this.runningStream,
      queued: this.getQueueSize(),
      maxConcurrent: this.maxConcurrent,
      maxPerUser: this.maxPerUser,
      maxPerFeature: this.maxPerFeature
    };
  }

  public enqueue<T>(priority: AIJobPriority, task: () => Promise<T>, options?: { abortSignal?: AbortSignal, isStream?: boolean, userId?: string, featureKey?: string }): Promise<T> {
    return new Promise((resolve, reject) => {
      if (options?.abortSignal?.aborted) {
        return reject(new Error("Aborted before queuing"));
      }
      
      if (this.getQueueSize() >= this.maxQueueSize) {
        return reject(new Error("AI Request Queue is full. Please try again later."));
      }
      
      const job: AIJob<T> = {
        id: crypto.randomUUID(),
        priority,
        task,
        resolve,
        reject,
        abortSignal: options?.abortSignal,
        isStream: options?.isStream,
        userId: options?.userId || "default",
        featureKey: options?.featureKey || "default"
      };
      
      if (job.abortSignal) {
        job.abortSignal.addEventListener('abort', () => {
          job.reject(new Error("Aborted in queue"));
        });
      }

      this.queues[priority].push(job);
      this.processQueue();
    });
  }

  private canRun(job: AIJob<any>): boolean {
    if (this.running >= this.maxConcurrent) return false;
    const uCount = this.userRunning.get(job.userId!) || 0;
    if (uCount >= this.maxPerUser) return false;
    const fCount = this.featureRunning.get(job.featureKey!) || 0;
    if (fCount >= this.maxPerFeature) return false;
    return true;
  }

  private processQueue() {
    if (this.running >= this.maxConcurrent) return;

    for (let i = 0; i < this.queues.length; i++) {
      const queue = this.queues[i];
      for (let j = 0; j < queue.length; j++) {
        const job = queue[j];
        if (job.abortSignal?.aborted) {
          queue.splice(j, 1);
          j--;
          continue;
        }
        
        if (this.canRun(job)) {
           queue.splice(j, 1);
           this.runJob(job);
           return; // Only start one job per processQueue call
        }
      }
    }
  }

  private async runJob(job: AIJob<any>) {
    this.running++;
    if (job.isStream) this.runningStream++;
    else this.runningDiscrete++;
    
    const uid = job.userId!;
    const fid = job.featureKey!;
    this.userRunning.set(uid, (this.userRunning.get(uid) || 0) + 1);
    this.featureRunning.set(fid, (this.featureRunning.get(fid) || 0) + 1);
    
    this.processQueue();
    
    let isStreamHeld = false;
    
    const release = () => {
      this.running--;
      if (job.isStream) this.runningStream--;
      else this.runningDiscrete--;
      
      this.userRunning.set(uid, Math.max(0, (this.userRunning.get(uid) || 0) - 1));
      this.featureRunning.set(fid, Math.max(0, (this.featureRunning.get(fid) || 0) - 1));
      
      this.processQueue();
    };

    try {
      const result = await job.task();
      if (job.abortSignal?.aborted) {
         job.reject(new Error("Aborted during execution"));
         release();
      } else {
         if (job.isStream && result != null) {
            isStreamHeld = true;
            // Wrap the stream to release the token when it finishes
            // Assuming result is an AsyncIterable or has a symbol.asyncIterator
            if (typeof result[Symbol.asyncIterator] === 'function') {
               const originalIterator = result[Symbol.asyncIterator].bind(result);
               result[Symbol.asyncIterator] = async function* () {
                 try {
                   yield* originalIterator();
                 } finally {
                   release();
                 }
               };
               job.resolve(result);
            } else if (result instanceof ReadableStream) {
               // If it's a standard web ReadableStream
               const [stream1, stream2] = result.tee();
               job.resolve(stream1);
               // Consume stream2 in background to detect end
               (async () => {
                 try {
                   const reader = stream2.getReader();
                   while (true) {
                     const { done } = await reader.read();
                     if (done) break;
                   }
                 } catch (e) {} finally {
                   release();
                 }
               })();
            } else {
               // Fallback if we can't wrap it
               job.resolve(result);
               release();
            }
         } else {
            job.resolve(result);
            release();
         }
      }
    } catch (error) {
      job.reject(error);
      if (!isStreamHeld) release();
    }
  }
}

export const aiQueue = new AIQueue();
