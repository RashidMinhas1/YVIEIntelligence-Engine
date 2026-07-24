import { getAISettings } from "./settings";
import { fetchAllProviderModels } from "./router";
import { getHealth } from "./health";

let isMonitoring = false;

export async function startBackgroundMonitor() {
  if (isMonitoring) return;
  isMonitoring = true;

  // Run in background without blocking
  (async () => {
    while (true) {
      try {
        await pingModels();
      } catch (err) {
        console.error("[Monitor] Error in background health check", err);
      }
      // Wait 5 minutes between full checks
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    }
  })();
}

async function pingModels() {
  const settings = getAISettings();
  if (!settings.providers) return;

  for (const provider of Object.keys(settings.providers)) {
    const config = settings.providers[provider as keyof typeof settings.providers];
    if (!config || config.isEnabled === false) continue;

    const apiKeys = config.apiKeys && config.apiKeys.length > 0 
      ? config.apiKeys 
      : (config.apiKey ? [config.apiKey] : []);

    for (const apiKey of apiKeys) {
      if (!apiKey) continue;

      // Just fetch models to verify connectivity and measure latency
      const start = Date.now();
      try {
        await fetchAllProviderModels(provider, apiKey, true); // true = force refresh
        const duration = Date.now() - start;
        // Mark generic health success for the provider
        // getHealth(provider, "api-ping", apiKey);
      } catch (err) {
        console.warn(`[Monitor] Ping failed for ${provider} key ${apiKey.substring(0, 5)}...`);
      }
    }
  }
}
