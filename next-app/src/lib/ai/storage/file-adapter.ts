import fs from "fs";
import path from "path";
import { AIStorageAdapter } from "./types";
import { AISettings } from "../settings";

export class FileStorageAdapter implements AIStorageAdapter {
  private filePath: string;

  constructor() {
    this.filePath = path.join(process.cwd(), ".ai-settings.json");
  }

  getSettings(): AISettings {
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, "utf-8");
        return JSON.parse(data) as AISettings;
      }
    } catch (err) {
      console.error("[FileStorageAdapter] Error reading AI settings file", err);
    }
    return {};
  }

  saveSettings(settings: AISettings): void {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(settings, null, 2), "utf-8");
    } catch (err) {
      console.error("[FileStorageAdapter] Error writing AI settings file", err);
    }
  }
}
