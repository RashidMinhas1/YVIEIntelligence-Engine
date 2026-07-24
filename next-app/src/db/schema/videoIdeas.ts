import { pgTable, text, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";

export const videoIdeasTable = pgTable("video_ideas", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: text("name").notNull(),
  
  selectedTitleFormatId: varchar("selected_title_format_id", { length: 255 }),
  editedTitle: text("edited_title"), // The user's finalized title
  
  selectedScriptFormatId: varchar("selected_script_format_id", { length: 255 }),
  editedScript: text("edited_script"), // The user's finalized script content
  
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type VideoIdea = typeof videoIdeasTable.$inferSelect;
export type NewVideoIdea = typeof videoIdeasTable.$inferInsert;
