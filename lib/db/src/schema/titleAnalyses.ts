import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const titleAnalysesTable = pgTable("title_analyses", {
  id: serial("id").primaryKey(),
  titles: jsonb("titles").notNull().$type<string[]>(),
  analysis: text("analysis").notNull(),
  outputMode: text("output_mode").notNull().default("docs"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTitleAnalysisSchema = createInsertSchema(titleAnalysesTable).omit({ id: true, createdAt: true });
export type InsertTitleAnalysis = z.infer<typeof insertTitleAnalysisSchema>;
export type TitleAnalysis = typeof titleAnalysesTable.$inferSelect;
