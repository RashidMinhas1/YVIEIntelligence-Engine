import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const generatedScriptsTable = pgTable('generated_scripts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  script: text('script').notNull(),
  wordCount: integer('word_count').notNull().default(0),
  outputMode: text('output_mode').notNull().default('docs'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type GeneratedScript = typeof generatedScriptsTable.$inferSelect;
export type NewGeneratedScript = typeof generatedScriptsTable.$inferInsert;
