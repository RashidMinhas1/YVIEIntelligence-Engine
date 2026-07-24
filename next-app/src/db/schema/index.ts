export * from "./videos";
export * from "./titleAnalyses";
export * from "./scriptAnalyses";
export * from "./generatedScripts";
export * from "./conversations";
export * from "./messages";
export * from "./titleFormats";
export * from "./videoIdeas";
export * from "./libraryFolders";
export * from "./libraryItems";
export * from "./jobs";
import { videosTable } from "./videos";
import { titleAnalysesTable } from "./titleAnalyses";
import { scriptAnalysesTable } from "./scriptAnalyses";
import { generatedScriptsTable } from "./generatedScripts";
import { conversationsTable } from "./conversations";
import { messagesTable } from "./messages";
import { titleFormatsTable } from "./titleFormats";
import { videoIdeasTable } from "./videoIdeas";
import { libraryFoldersTable } from "./libraryFolders";
import { libraryItemsTable } from "./libraryItems";
import { jobsTable } from "./jobs";
export const schema = {
  videosTable,
  titleAnalysesTable,
  scriptAnalysesTable,
  generatedScriptsTable,
  conversationsTable,
  messagesTable,
  titleFormatsTable,
  videoIdeasTable,
  libraryFoldersTable,
  libraryItemsTable,
  jobsTable,
};
