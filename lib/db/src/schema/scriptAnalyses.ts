import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scriptAnalysesTable = pgTable("script_analyses", {
  id: serial("id").primaryKey(),
  scriptPreview: text("script_preview").notNull(),
  analysis: text("analysis").notNull(),
  outputMode: text("output_mode").notNull().default("docs"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertScriptAnalysisSchema = createInsertSchema(scriptAnalysesTable).omit({ id: true, createdAt: true });
export type InsertScriptAnalysis = z.infer<typeof insertScriptAnalysisSchema>;
export type ScriptAnalysis = typeof scriptAnalysesTable.$inferSelect;
