import { getSafeAISettings } from "./src/lib/ai/settings.js";

try {
  console.log("Settings:", getSafeAISettings());
} catch (e) {
  console.error("Error:", e);
}
