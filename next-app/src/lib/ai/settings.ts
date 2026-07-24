import { FileStorageAdapter } from "./storage/file-adapter";
import { AIStorageAdapter } from "./storage/types";
import { encrypt, decrypt, isMaskedKey, maskApiKey } from "../encryption";

export type AIProviderConfig = {
  apiKey?: string; // Legacy
  apiKeys?: string[]; // New
  baseUrl?: string;
  model?: string;
  isEnabled?: boolean;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retryCount?: number;
  loadBalancingStrategy?: "round_robin" | "least_latency" | "least_errors" | "weighted";
};

export type FeatureModelOverride = {
  provider?: string;
  model?: string;
  apiKeys?: string[];
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retryCount?: number;
  streaming?: boolean;
  jsonMode?: boolean;
  visionMode?: boolean;
  loadBalancingStrategy?: "round_robin" | "least_latency" | "least_errors" | "weighted";
  isLocalOverrideEnabled?: boolean;
};

export type AISettings = {
  activeProvider?: string;
  providers?: {
    openai?: AIProviderConfig;
    gemini?: AIProviderConfig;
    openrouter?: AIProviderConfig;
  };
  features?: Record<string, FeatureModelOverride>;
};


// Instantiate the appropriate storage adapter
// This allows future swaps to a DatabaseStorageAdapter without changing the rest of this file.
const storageAdapter: AIStorageAdapter = new FileStorageAdapter();

/**
 * Retrieves AI Settings, decrypting any stored API keys so the backend can use them.
 */
export function getAISettings(): AISettings {
  const rawSettings = storageAdapter.getSettings();
  
  // Create a deep copy to avoid mutating the cached object if the adapter caches it
  const settings: AISettings = JSON.parse(JSON.stringify(rawSettings));
  
  if (settings.providers) {
    for (const key of Object.keys(settings.providers)) {
      const providerKey = key as keyof typeof settings.providers;
      const config = settings.providers[providerKey];
      if (!config) continue;
      
      // Auto migrate apiKey -> apiKeys[]
      if (config.apiKey && (!config.apiKeys || config.apiKeys.length === 0)) {
        config.apiKeys = [config.apiKey];
      }
      
      if (config.apiKeys) {
        config.apiKeys = config.apiKeys.map(k => decrypt(k)).filter(Boolean);
        if (config.apiKeys.length > 0) config.apiKey = config.apiKeys[0]; // Keep legacy field populated
      } else {
        config.apiKeys = [];
      }
    }
  }
  
  if (settings.features) {
    for (const key of Object.keys(settings.features)) {
      const feature = settings.features[key];
      if (feature && feature.apiKeys) {
        feature.apiKeys = feature.apiKeys.map(k => decrypt(k)).filter(Boolean);
      }
    }
  }
  
  return settings;
}

export function saveAISettings(newSettings: AISettings) {
  const currentSettings = storageAdapter.getSettings(); // Raw, encrypted
  
  const nextProviders = { ...currentSettings.providers };
  
  if (newSettings.providers) {
    for (const key of Object.keys(newSettings.providers)) {
      const providerKey = key as keyof typeof newSettings.providers;
      const newConfig = newSettings.providers[providerKey];
      const currentConfig = currentSettings.providers?.[providerKey];
      
      if (newConfig) {
        let finalApiKeys = currentConfig?.apiKeys || [];
        if (!finalApiKeys.length && currentConfig?.apiKey) {
          finalApiKeys = [currentConfig.apiKey];
        }
        
        if (newConfig.apiKeys !== undefined) {
          // If apiKeys is explicitly provided, map it
          finalApiKeys = newConfig.apiKeys.map((k, i) => {
            if (!k) return "";
            if (isMaskedKey(k)) {
              // Try to find matching encrypted key
              const match = finalApiKeys.find(oldKey => {
                if (!oldKey) return false;
                try { return maskApiKey(decrypt(oldKey)) === k; } catch { return false; }
              });
              return match || finalApiKeys[i] || "";
            }
            return encrypt(k);
          }).filter(k => k !== "");
        } else if (newConfig.apiKey !== undefined) {
          // Legacy flow
          let finalApiKey = currentConfig?.apiKey;
          if (newConfig.apiKey && !isMaskedKey(newConfig.apiKey)) {
            finalApiKey = encrypt(newConfig.apiKey);
          } else if (newConfig.apiKey === "") {
            finalApiKey = "";
          }
          finalApiKeys = finalApiKey ? [finalApiKey] : [];
        }
        
        nextProviders[providerKey] = {
          ...currentConfig,
          ...newConfig,
          apiKey: finalApiKeys[0] || "",
          apiKeys: finalApiKeys
        };
      }
    }
  }
  
  const nextSettings: AISettings = {
    ...currentSettings,
    ...newSettings,
    providers: nextProviders
  };

  if (newSettings.features) {
    const nextFeatures: Record<string, FeatureModelOverride> = { ...currentSettings.features };
    for (const key of Object.keys(newSettings.features)) {
      const newFeature = newSettings.features[key];
      const currentFeature = currentSettings.features?.[key];
      
      let finalApiKeys = currentFeature?.apiKeys || [];
      if (newFeature && newFeature.apiKeys !== undefined) {
        finalApiKeys = newFeature.apiKeys.map((k, i) => {
          if (!k) return "";
          if (isMaskedKey(k)) {
            const match = finalApiKeys.find(oldKey => {
              if (!oldKey) return false;
              try { return maskApiKey(decrypt(oldKey)) === k; } catch { return false; }
            });
            return match || finalApiKeys[i] || "";
          }
          return encrypt(k);
        }).filter(k => k !== "");
      }
      
      nextFeatures[key] = {
        ...currentFeature,
        ...newFeature,
        apiKeys: finalApiKeys
      };
    }
    nextSettings.features = nextFeatures;
  }
  
  storageAdapter.saveSettings(nextSettings);
}

export function getSafeAISettings(): AISettings {
  const settings = getAISettings(); // This decrypts them
  
  if (settings.providers) {
    for (const key of Object.keys(settings.providers)) {
      const providerKey = key as keyof typeof settings.providers;
      const config = settings.providers[providerKey];
      if (!config) continue;
      
      if (config.apiKeys) {
        config.apiKeys = config.apiKeys.map(k => maskApiKey(k));
        if (config.apiKeys.length > 0) config.apiKey = config.apiKeys[0];
      }
    }
  }

  if (settings.features) {
    for (const key of Object.keys(settings.features)) {
      const feature = settings.features[key];
      if (feature && feature.apiKeys) {
        feature.apiKeys = feature.apiKeys.map(k => maskApiKey(k));
      }
    }
  }
  
  return settings;
}

