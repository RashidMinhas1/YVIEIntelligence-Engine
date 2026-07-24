import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const generatedScriptsTable = pgTable("generated_scripts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  script: text("script").notNull(),
  wordCount: integer("word_count").notNull().default(0),
  outputMode: text("output_mode").notNull().default("docs"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGeneratedScriptSchema = createInsertSchema(generatedScriptsTable).omit({ id: true, createdAt: true });
export type InsertGeneratedScript = z.infer<typeof insertGeneratedScriptSchema>;
export type GeneratedScript = typeof generatedScriptsTable.$inferSelect;
