import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const scriptAnalysesTable = pgTable('script_analyses', {
  id: serial('id').primaryKey(),
  scriptPreview: text('script_preview').notNull(),
  analysis: text('analysis').notNull(),
  outputMode: text('output_mode').notNull().default('docs'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ScriptAnalysis = typeof scriptAnalysesTable.$inferSelect;
export type NewScriptAnalysis = typeof scriptAnalysesTable.$inferInsert;
