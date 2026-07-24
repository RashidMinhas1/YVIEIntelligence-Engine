import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const titleFormatsTable = pgTable("title_formats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  pattern: text("pattern").notNull(),
  description: text("description"),
  originalTitle: text("original_title"),
  generatedTitle: text("generated_title"),
  psychology: text("psychology"),
  formula: text("formula"),
  hookType: text("hook_type"),
  emotionalTrigger: text("emotional_trigger"),
  providerUsed: text("provider_used"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TitleFormat = typeof titleFormatsTable.$inferSelect;
export type NewTitleFormat = typeof titleFormatsTable.$inferInsert;
