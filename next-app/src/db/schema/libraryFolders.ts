import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const libraryFoldersTable = pgTable("library_folders", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: text("name").notNull(),
  section: text("section").notNull(), // 'video_ideas' | 'titles' | 'scripts' | 'hooks' | 'ctas' | 'thumbnails' | 'reports'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
