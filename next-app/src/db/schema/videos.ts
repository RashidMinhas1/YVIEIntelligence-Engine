import { pgTable, serial, text, timestamp, integer, jsonb } from 'drizzle-orm/pg-core';

export const videosTable = pgTable('videos', {
  id: serial('id').primaryKey(),
  competitor: text('competitor').notNull(),
  title: text('title').notNull(),
  views: text('views').notNull().default('0'),
  url: text('url').notNull(),
  publishedAt: text('published_at'),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Video = typeof videosTable.$inferSelect;
export type NewVideo = typeof videosTable.$inferInsert;
