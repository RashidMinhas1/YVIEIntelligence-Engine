import { getAISettings } from "./settings";

export interface ImageGenerationOptions {
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: string; // e.g., "16:9", "1:1", "9:16"
  width?: number;
  height?: number;
  quality?: "standard" | "hd";
  providerOverride?: string;
  modelOverride?: string;
}

export interface ImageGenerationResult {
  url: string;
  provider: string;
  model: string;
  createdAt: string;
}

export interface AIImageProvider {
  id: string;
  generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult>;
}

// -------------------------------------------------------------------------------------------------
// Base Abstraction
// -------------------------------------------------------------------------------------------------

class MockImageProvider implements AIImageProvider {
  id = "mock";
  async generateImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
    // Generate a beautiful placeholder using Unsplash or Placehold.co
    // Using placehold.co to reflect the requested aspect ratio visually
    let width = 1920;
    let height = 1080;
    
    if (options.aspectRatio === "9:16") {
      width = 1080;
      height = 1920;
    } else if (options.aspectRatio === "1:1") {
      width = 1080;
      height = 1080;
    }

    const encodedPrompt = encodeURIComponent((options.prompt || "Generated Thumbnail").substring(0, 50) + "...");
    const url = `https://placehold.co/${width}x${height}/1e1e1e/888888.png?text=${encodedPrompt}`;

    // Simulate network delay for realism in preview generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      url,
      provider: "mock",
      model: "placeholder",
      createdAt: new Date().toISOString()
    };
  }
}

// -------------------------------------------------------------------------------------------------
// Provider Registry
// -------------------------------------------------------------------------------------------------

const providers: Record<string, AIImageProvider> = {
  mock: new MockImageProvider(),
  // Real providers (OpenAI, Flux, Stability) will be registered here in future milestones
};

export function getImageProvider(providerName: string): AIImageProvider {
  const provider = providers[providerName.toLowerCase()];
  if (!provider) {
    console.warn(`[AI] Image provider '${providerName}' not found. Falling back to mock.`);
    return providers.mock;
  }
  return provider;
}

export async function generateAIImage(options: ImageGenerationOptions): Promise<ImageGenerationResult> {
  const settings = getAISettings();
  // Currently defaulting to 'mock' for Milestone 18 as requested (placeholder only)
  const providerName = options.providerOverride || "mock"; 
  
  const provider = getImageProvider(providerName);
  
  try {
    return await provider.generateImage(options);
  } catch (error: any) {
    console.error(`[AI Image] Error generating image via ${providerName}:`, error);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
}
