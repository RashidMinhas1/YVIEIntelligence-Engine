import { pgTable, serial, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const titleAnalysesTable = pgTable('title_analyses', {
  id: serial('id').primaryKey(),
  titles: jsonb('titles').notNull().$type<string[]>(),
  analysis: text('analysis').notNull(),
  outputMode: text('output_mode').notNull().default('docs'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type TitleAnalysis = typeof titleAnalysesTable.$inferSelect;
export type NewTitleAnalysis = typeof titleAnalysesTable.$inferInsert;
