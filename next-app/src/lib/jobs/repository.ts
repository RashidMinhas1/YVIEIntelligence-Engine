import { getDb, jobsTable } from "@/db";
import { eq, desc } from "drizzle-orm";
import { localDb } from "@/lib/local-db";
import { Job, NewJob } from "@/db/schema/jobs";

export const JobRepository = {
  async createJob(job: Partial<NewJob>): Promise<string> {
    const defaultJob = {
      ...job,
      id: job.id || Math.random().toString(36).substring(7),
      status: job.status || "queued",
      progress: job.progress || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const db = getDb();
      const [inserted] = await db.insert(jobsTable).values(defaultJob as any).returning();
      return inserted.id;
    } catch (e) {
      console.log("[Local Dev] Using local JSON DB for Job creation");
      const inserted = localDb.insert("jobs", defaultJob);
      return inserted.id.toString();
    }
  },

  async getJob(id: string): Promise<Job | null> {
    try {
      const db = getDb();
      const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
      return job || null;
    } catch (e) {
      const jobs = localDb.getAll("jobs");
      const job = jobs.find((j: any) => j.id.toString() === id);
      return job || null;
    }
  },

  async updateJob(id: string, updates: Partial<Job>): Promise<void> {
    const updatedFields = { ...updates, updatedAt: new Date() };
    try {
      const db = getDb();
      await db.update(jobsTable).set(updatedFields).where(eq(jobsTable.id, id));
    } catch (e) {
      const dbObj = localDb.getDb();
      const jobIndex = dbObj.jobs.findIndex((j: any) => j.id.toString() === id);
      if (jobIndex > -1) {
        dbObj.jobs[jobIndex] = { ...dbObj.jobs[jobIndex], ...updatedFields };
        localDb.saveDb(dbObj);
      }
    }
  },
  
  async deleteJob(id: string): Promise<void> {
    try {
      const db = getDb();
      await db.delete(jobsTable).where(eq(jobsTable.id, id));
    } catch (e) {
      const dbObj = localDb.getDb();
      dbObj.jobs = dbObj.jobs.filter((j: any) => j.id.toString() !== id);
      localDb.saveDb(dbObj);
    }
  }
};
