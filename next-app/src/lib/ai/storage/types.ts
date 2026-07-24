import { AISettings } from "../settings";

export interface AIStorageAdapter {
  /**
   * Retrieves the current AI settings.
   * Note: The adapter does NOT decrypt the data. It returns the raw encrypted data.
   */
  getSettings(): AISettings;

  /**
   * Saves the provided AI settings.
   * Note: The adapter expects the data to already be encrypted by the caller.
   */
  saveSettings(settings: AISettings): void;
}
