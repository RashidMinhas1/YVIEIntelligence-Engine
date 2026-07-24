import { pgTable, text, timestamp, varchar, jsonb, integer } from "drizzle-orm/pg-core";

export const libraryItemsTable = pgTable("library_items", {
  id: varchar("id", { length: 255 }).primaryKey(),
  folderId: varchar("folder_id", { length: 255 }), // Can be null if it's in the root
  type: text("type").notNull(), // 'title' | 'script' | 'hook' | 'cta' | 'thumbnail' | 'report'
  title: text("title").notNull(), // Pattern Name or Item Title
  content: jsonb("content").notNull(), // Flexible payload containing the type-specific data (e.g. hookSection, psychologyFormula)
  summary: text("summary"), // Optional short description
  metadata: jsonb("metadata").default('{}'), // originalSource, provider, competitorVideo, channel, analysisType
  tags: jsonb("tags").default('[]'), // array of strings
  version: integer("version").default(1).notNull(),
  parentId: varchar("parent_id", { length: 255 }), // For version history / branching
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
