import { getAISettings } from "./settings";

export function getActiveProviderName(): string {
  const settings = getAISettings();
  return settings.activeProvider || process.env.ACTIVE_AI_PROVIDER || "openai";
}
