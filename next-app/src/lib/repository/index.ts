import { KnowledgeRepository, TranslationRepository, YouTubeRepository } from "./interfaces";
import { JsonStorageProvider } from "./json-provider";

const jsonProvider = new JsonStorageProvider();

// Singleton repository instances
export const knowledgeRepo = new KnowledgeRepository(jsonProvider);
export const translationRepo = new TranslationRepository(jsonProvider);
export const youtubeRepo = new YouTubeRepository(jsonProvider);

// Export types and interfaces for consumers
export * from "./interfaces";
export { JsonStorageProvider } from "./json-provider";
