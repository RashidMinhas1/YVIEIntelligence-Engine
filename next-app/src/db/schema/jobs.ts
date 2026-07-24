import { pgTable, text, timestamp, integer, json, varchar } from "drizzle-orm/pg-core";

export const jobsTable = pgTable("jobs", {
  id: varchar("id", { length: 128 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  type: varchar("type", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("queued"), // queued, waiting, processing, completed, failed, cancelled, retry
  progress: integer("progress").default(0),
  totalSteps: integer("total_steps").default(100),
  currentStep: text("current_step"),
  payload: json("payload"),
  result: json("result"),
  error: text("error"),
  retryCount: integer("retry_count").default(0),
  priority: integer("priority").default(0),
  startedAt: timestamp("started_at"),
  finishedAt: timestamp("finished_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Job = typeof jobsTable.$inferSelect;
export type NewJob = typeof jobsTable.$inferInsert;
