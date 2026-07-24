import { registerJobHandler } from "./worker";
import { IntelligenceEngine } from "@/lib/intelligence/engine";
import { callAI } from "@/lib/ai";
import { KNOWLEDGE_CATEGORIES } from "@/lib/config/knowledge-categories";
import { compileLivePrompt } from "@/lib/assembly/engine";
import { getDb, generatedScriptsTable, titleAnalysesTable, scriptAnalysesTable } from "@/db";
import { buildTitleAnalysisPrompt, buildScriptAnalysisPrompt } from "@/lib/prompts";

let initialized = false;

export function initJobs() {
  if (initialized) return;
  initialized = true;

  // Additional handler groups
  registerStudioProductionHandlers();

  registerJobHandler("intelligence_analyze", async (jobId, payload, updateProgress) => {
    await updateProgress(10, "Initializing Intelligence Engine...");
    const engine = new IntelligenceEngine();
    
    await updateProgress(50, "Analyzing script with AI Script Director...");
    const report = await engine.analyzeScript(payload.scriptContent, payload.videoTitle);
    
    await updateProgress(100, "Analysis complete.");
    return { report };
  });

  registerJobHandler("intelligence_optimize", async (jobId, payload, updateProgress) => {
    await updateProgress(10, "Initializing Optimization Engine...");
    const engine = new IntelligenceEngine();
    
    await updateProgress(50, "Generating optimization variant...");
    const variant = await engine.generateOptimizationVariant(
      payload.moduleType,
      payload.originalText,
      payload.scriptContext,
      payload.specificInstruction
    );
    
    await updateProgress(100, "Optimization complete.");
    return { variant };
  });

  registerJobHandler("knowledge_extract", async (jobId, payload, updateProgress) => {
    await updateProgress(10, "Initializing knowledge extraction...");
    
    const categoryConfig = KNOWLEDGE_CATEGORIES.find(c => c.id === payload.categoryId);
    if (!categoryConfig) throw new Error("Invalid category ID");

    const schemaFields: Record<string, string> = {};
    for (const field of categoryConfig.fields) {
      schemaFields[field.id] = field.type === "number" ? "number" : "string";
    }

    const prompt = `You are an elite YouTube AI Knowledge Extractor.
Your job is to convert a raw snippet of a competitor's script or report into a highly reusable, generalized Knowledge Object.

RAW TEXT TO EXTRACT:
"""
${payload.text}
"""

${payload.originalScriptContext ? `ORIGINAL SCRIPT CONTEXT:\n"""\n${payload.originalScriptContext}\n"""\n` : ""}

CRITICAL INSTRUCTIONS:
1. Normalization: Remove all highly specific names, brands, or topics. Replace them with generalized placeholders (e.g., [Modern Celebrity], [Historical Event], [Pain Point]).
2. Conversion: Convert examples into templates. Generalize the strategy.
3. Completeness: Ensure the extracted knowledge is useful and actionable.

You must output STRICT JSON matching this exact structure:
${JSON.stringify({ content: schemaFields, generatedTitle: "A concise, descriptive title (e.g. The 'Before [X]' Hook)", summary: "A 1-sentence summary of why this works" }, null, 2)}
`;

    await updateProgress(40, "Generating generic knowledge template...");
    const rawResponse = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    
    await updateProgress(80, "Parsing result...");
    const cleanResponse = rawResponse.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    const result = JSON.parse(cleanResponse);
    
    await updateProgress(100, "Extraction complete.");
    return {
      content: result.content,
      title: result.generatedTitle || payload.title,
      summary: result.summary || ""
    };
  });

  registerJobHandler("scripts_assemble", async (jobId, payload, updateProgress) => {
    await updateProgress(10, "Initializing knowledge assembly...");
    
    const { selections, memoryProfile, topic, wordCountMode, targetWordCount, provider, objects, customPromptOverride } = payload;
    
    let targetWords = `${targetWordCount} words`;
    if (wordCountMode === "approximate_word_count") targetWords = `Approximately ${targetWordCount} words`;
    else if (wordCountMode === "maximum_retention") targetWords = `Optimized for maximum retention, regardless of word count`;

    await updateProgress(20, "Compiling live prompt...");
    const prompt = customPromptOverride || compileLivePrompt(selections, objects, memoryProfile, topic, targetWords);

    await updateProgress(40, "Assembling final script with AI...");
    let finalScript = await callAI(prompt, { mode: "text" });
    finalScript = finalScript.replace(/^```[a-z]*\n/i, "").replace(/\n```$/i, "").trim();

    await updateProgress(90, "Saving assembled script...");
    const db = getDb();
    const wordCount = finalScript.split(/\s+/).length;

    let savedId: number = -1;
    try {
      const [saved] = await db
        .insert(generatedScriptsTable)
        .values({
          title: `Assembly: ${topic}`,
          script: finalScript,
          wordCount,
          outputMode: "docs",
        })
        .returning();
      savedId = saved.id;
    } catch (dbErr) {
      console.warn("[Local Dev] DB write failed. Returning script directly.", dbErr);
    }

    await updateProgress(100, "Script assembled successfully!");
    return {
      id: savedId,
      script: finalScript,
      wordCount,
      promptUsed: prompt,
      providerUsed: provider || "default"
    };
  });

  registerJobHandler("titles_analyze", async (jobId, payload, updateProgress) => {
    await updateProgress(10, "Initializing title analysis...");
    const { titles, outputMode, customPrompt } = payload;
    
    await updateProgress(30, "Building prompt...");
    const prompt = buildTitleAnalysisPrompt(titles, customPrompt);
    let analysis = "";
    
    await updateProgress(50, "Analyzing titles with AI...");
    const rawAnalysis = await callAI(prompt, { mode: outputMode, responseFormat: "json_object" });
    analysis = rawAnalysis.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();

    // Validate JSON before saving
    try {
      JSON.parse(analysis);
    } catch (e) {
      throw new Error(`AI returned invalid JSON formatting. Please retry. (Response: ${analysis.substring(0, 50)}...)`);
    }

    await updateProgress(90, "Saving analysis results...");
    const db = getDb();
    let savedId = "mock-id";
    try {
      const [saved] = await db
        .insert(titleAnalysesTable)
        .values({ titles, analysis, outputMode })
        .returning();
      savedId = saved.id.toString();
    } catch (dbErr) {
      console.warn("[Local Dev] DB write failed. Returning analysis directly.", dbErr);
    }

    await updateProgress(100, "Title analysis complete.");
    return {
      id: savedId,
      analysis,
      outputMode,
      createdAt: new Date().toISOString(),
    };
  });

  registerJobHandler("scripts_analyze", async (jobId, payload, updateProgress) => {
    await updateProgress(10, "Initializing script analysis...");
    const { script, outputMode } = payload;
    
    await updateProgress(30, "Building prompt...");
    const prompt = buildScriptAnalysisPrompt(script);
    let analysis = "";
    
    await updateProgress(50, "Analyzing script with AI...");
    const rawAnalysis = await callAI(prompt, { mode: outputMode, responseFormat: "text" });
    analysis = rawAnalysis.trim();

    await updateProgress(90, "Saving analysis results...");
    const scriptPreview = script.substring(0, 300) + (script.length > 300 ? "..." : "");
    const db = getDb();
    let savedId = "mock-id";
    try {
      const [saved] = await db
        .insert(scriptAnalysesTable)
        .values({ scriptPreview, analysis, outputMode })
        .returning();
      savedId = saved.id.toString();
    } catch (dbErr) {
      console.warn("[Local Dev] DB write failed. Returning analysis directly.", dbErr);
    }

    await updateProgress(100, "Script analysis complete.");
    return {
      id: savedId,
      analysis,
      outputMode,
      createdAt: new Date().toISOString(),
    };
  });

  registerJobHandler("studio_ai_task", async (jobId, payload, updateProgress) => {
    await updateProgress(10, "Initializing AI operation...");
    const { action, sectionType, currentContent, promptInstruction, fullScriptContext } = payload;
    
    await updateProgress(30, `Executing ${action}...`);
    
    const systemPrompt = `You are an expert YouTube Script Writer and Editor. 
You are performing a '${action}' operation on a section of type '${sectionType}'.
Context of the full script:
${fullScriptContext || "No context provided."}

Follow these specific instructions:
${promptInstruction || "Modify the text to be better, more engaging, and perfectly aligned with YouTube retention patterns."}`;

    const userPrompt = currentContent 
      ? `Here is the current text to modify:\n\n${currentContent}` 
      : `Generate new content for the ${sectionType} section.`;

    const rawResponse = await callAI(userPrompt, { mode: "text", systemPrompt, responseFormat: "text" });
    
    await updateProgress(100, "AI operation complete.");
    return { updatedContent: rawResponse.trim() };
  });

  registerJobHandler("studio_analyze_task", async (jobId, payload, updateProgress) => {
    await updateProgress(20, "Initializing live analysis...");
    const { scriptContext } = payload;

    const systemPrompt = `You are a YouTube Retention Analyst.
Analyze the following script and provide a JSON response with the following metrics (all out of 100):
{
  "retentionScore": number,
  "emotionalScore": number,
  "curiosityScore": number,
  "seoScore": number,
  "readability": "string grade (e.g. 8th Grade)",
  "wordCount": number,
  "estimatedReadingTime": "string (e.g. 3 mins)",
  "suggestions": ["string", "string"]
}`;

    await updateProgress(50, "Calculating retention metrics...");
    const rawResponse = await callAI(scriptContext, { mode: "text", systemPrompt, responseFormat: "json_object" });
    
    let analysis;
    try {
      analysis = JSON.parse(rawResponse);
    } catch {
      analysis = {
        retentionScore: 0, emotionalScore: 0, curiosityScore: 0, seoScore: 0, 
        readability: "N/A", wordCount: 0, estimatedReadingTime: "N/A", suggestions: ["Failed to parse analysis"]
      };
    }

    await updateProgress(100, "Analysis complete.");
    return { analysis };
  });
  registerJobHandler("studio_research_summarize", async (jobId, payload, updateProgress) => {
    await updateProgress(20, "Analyzing source content...");
    const { source } = payload;
    
    const systemPrompt = `You are an expert AI Research Assistant for a YouTube creator.
Analyze the following source material and provide a JSON response with:
{
  "summary": "A concise 2-3 sentence summary",
  "insights": ["key insight 1", "key insight 2", "key insight 3"]
}

Source Title: ${source.title}
Source URL: ${source.url || 'None'}
Source Notes/Content:
${source.notes}`;

    await updateProgress(50, "Extracting insights...");
    const rawResponse = await callAI("Please summarize the source material.", { mode: "text", systemPrompt, responseFormat: "json_object" });
    
    let result;
    try {
      result = JSON.parse(rawResponse);
    } catch {
      result = { summary: "Failed to parse summary", insights: [] };
    }

    await updateProgress(100, "Summarization complete.");
    return result;
  });

  registerJobHandler("studio_research_generate", async (jobId, payload, updateProgress) => {
    await updateProgress(20, "Analyzing global research...");
    const { research } = payload;
    
    const systemPrompt = `You are an elite YouTube Strategist.
Brainstorm high-converting ideas based ONLY on the following research workspace notes and sources.
Return a JSON response with:
{
  "videoIdeas": ["idea 1", "idea 2", "idea 3"],
  "hooks": ["hook 1", "hook 2", "hook 3"],
  "angles": ["angle 1", "angle 2"]
}`;

    const userPrompt = `Research Notes:\n${research.notes}\n\nSources:\n${(research.sources || []).map((s: any) => `- ${s.title}: ${s.summary || s.notes}`).join("\n")}`;

    await updateProgress(50, "Generating video ideas & hooks...");
    const rawResponse = await callAI(userPrompt, { mode: "text", systemPrompt, responseFormat: "json_object" });
    
    let result;
    try {
      result = JSON.parse(rawResponse);
    } catch {
      result = { videoIdeas: [], hooks: [], angles: [] };
    }

    await updateProgress(100, "Idea generation complete.");
    return result;
  });

  registerJobHandler("studio_storyboard_analyze", async (jobId, payload, updateProgress) => {
    await updateProgress(10, "Analyzing storyboard and timeline...");
    const { sections } = payload;
    
    await updateProgress(40, "Calculating scores...");
    const prompt = `Analyze this YouTube storyboard timeline. Estimate watch time, retention curve, emotional peaks, hook strength (1-100), and ending strength (1-100). Return ONLY JSON matching { estimatedWatchTime: "X mins", totalDuration: number_in_seconds, retentionCurve: "Description", slowSections: ["Scene X", ...], fastSections: [], deadMoments: [], emotionalPeaks: [], curiosityGaps: [], hookStrength: 85, endingStrength: 90, ctaPosition: "Scene Y", rehookOpportunities: [] }.\n\nSections: ${JSON.stringify(sections)}`;
    
    await updateProgress(60, "Generating insights...");
    const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    const parsed = JSON.parse(result.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim());
    
    await updateProgress(100, "Analysis complete.");
    return {
      success: true,
      analysis: parsed
    };
  });

  registerJobHandler("studio_storyboard_generate", async (jobId, payload, updateProgress) => {
    await updateProgress(10, "Starting AI Storyboard action...");
    const { action, sections, research } = payload;
    
    await updateProgress(40, `Executing action: ${action}...`);
    const prompt = `As an elite YouTube strategist, perform: ${action}. Based on the following script sections and research, generate an array of new or updated scene objects. Return ONLY JSON matching { scenes: [ { type, content, title, duration, visualNotes, brollNotes, cameraDirection, onScreenText, transitionNotes, sceneGoal, emotion, hookType, curiosityLevel, editingNotes, soundEffects, musicNotes, zoomMotion, aiSuggestions: [] } ] }.\n\nSections: ${JSON.stringify(sections)}\n\nResearch: ${JSON.stringify(research)}`;
    
    await updateProgress(70, "Processing AI response...");
    const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    const parsed = JSON.parse(result.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim());
    
    await updateProgress(100, "Action complete.");
    return {
      success: true,
      scenes: parsed.scenes
    };
  });
}

// -------------------------------------------------------------------------------------------------
// Studio - Production Suite Handlers
// -------------------------------------------------------------------------------------------------

export async function registerStudioProductionHandlers() {
  registerJobHandler("studio_generate_thumbnail", async (jobId, payload, updateProgress) => {
    const { sections } = payload;
    await updateProgress(20, "Analyzing script for visual hooks...");
    const prompt = `As a top YouTube Thumbnail strategist, analyze this script and generate 3 extremely high-CTR thumbnail concepts. Return JSON matching: { thumbnails: [ { id, title, ctrScore (0-100), curiosityScore (0-100), emotionScore (0-100), visualHook, mainSubject, background, colorPalette, textPlacement, faceExpression, cameraAngle, negativeSpace, aiSuggestions: [], imagePrompt, negativePrompt, aspectRatio, style, lighting, composition, cameraLens, renderEngine } ] }. Script: ${JSON.stringify(sections)}`;
    
    await updateProgress(60, "Generating concepts...");
    const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    const parsed = JSON.parse(result.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim());
    await updateProgress(100, "Thumbnails generated.");
    return { success: true, thumbnails: parsed.thumbnails };
  });

  registerJobHandler("studio_generate_titles", async (jobId, payload, updateProgress) => {
    const { sections } = payload;
    await updateProgress(30, "Generating click-optimized titles...");
    const prompt = `Generate 5 high-CTR YouTube titles based on this script. Return JSON matching: { titles: [ { id, title, seoScore, curiosityScore, emotionalScore, clickPotential, characterCount } ] }. Script: ${JSON.stringify(sections)}`;
    const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    const parsed = JSON.parse(result.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim());
    await updateProgress(100, "Titles generated.");
    return { success: true, titles: parsed.titles };
  });

  registerJobHandler("studio_generate_description", async (jobId, payload, updateProgress) => {
    const { sections } = payload;
    await updateProgress(30, "Drafting description...");
    const prompt = `Write a complete YouTube description based on this script. Return JSON matching: { description: { full, short, cta, credits: "Credits go here", affiliate: "Affiliate links go here", disclaimer: "Disclaimer here" } }. Script: ${JSON.stringify(sections)}`;
    const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    const parsed = JSON.parse(result.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim());
    await updateProgress(100, "Description complete.");
    return { success: true, description: parsed.description };
  });

  registerJobHandler("studio_generate_tags", async (jobId, payload, updateProgress) => {
    const { sections } = payload;
    await updateProgress(30, "Extracting keywords and tags...");
    const prompt = `Generate SEO tags based on this script. Return JSON matching: { tags: { youtubeTags: [], searchKeywords: [], longTailKeywords: [], relatedSearchTerms: [], hashtags: [] } }. Script: ${JSON.stringify(sections)}`;
    const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    const parsed = JSON.parse(result.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim());
    await updateProgress(100, "Tags generated.");
    return { success: true, tags: parsed.tags };
  });

  registerJobHandler("studio_generate_chapters", async (jobId, payload, updateProgress) => {
    const { sections } = payload;
    await updateProgress(30, "Estimating timestamps and creating chapters...");
    const prompt = `Create timestamp chapters for this script based on section pacing. Assume 150 WPM. Return JSON matching: { chapters: [ { id, time: "MM:SS", title, summary } ] }. Script: ${JSON.stringify(sections)}`;
    const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    const parsed = JSON.parse(result.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim());
    await updateProgress(100, "Chapters complete.");
    return { success: true, chapters: parsed.chapters };
  });

  registerJobHandler("studio_generate_checklist", async (jobId, payload, updateProgress) => {
    const { sections } = payload;
    await updateProgress(30, "Extracting editing requirements...");
    const prompt = `Extract an editing checklist from the visualNotes, brollNotes, etc. Return JSON matching: { editingChecklist: [ { id, category: "broll"|"graphics"|"sfx"|"music"|"zoom"|"motion"|"text"|"camera", description, completed: false } ] }. Script: ${JSON.stringify(sections)}`;
    const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    const parsed = JSON.parse(result.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim());
    await updateProgress(100, "Checklist extracted.");
    return { success: true, editingChecklist: parsed.editingChecklist };
  });

  registerJobHandler("studio_generate_thumbnail_prompt", async (jobId, payload, updateProgress) => {
    const { thumbnail, sections } = payload;
    
    await updateProgress(20, "Analyzing thumbnail concept for AI Prompt translation...");
    const prompt = `You are an elite AI Image Generation Prompt Engineer.
Convert this YouTube Thumbnail Concept into a production-ready AI image prompt.
Thumbnail Concept: ${JSON.stringify(thumbnail)}

Generate a highly detailed, professional prompt.
Return ONLY JSON matching exactly:
{
  "imagePrompt": "Full positive prompt (Subject, Environment, Composition, Camera Angle, Camera Lens, Lighting, Color Palette, Mood, Emotion, Visual Hook, Focus, Depth of Field, Background, Text Placement)",
  "negativePrompt": "Full negative prompt to avoid bad artifacts",
  "aspectRatio": "16:9",
  "style": "e.g. Hyper-realistic, 3D Render, Vector Art",
  "lighting": "e.g. Cinematic, Studio, Neon",
  "composition": "e.g. Rule of thirds, Center focal",
  "cameraLens": "e.g. 24mm wide angle",
  "renderEngine": "e.g. Unreal Engine 5, Octane",
  "thumbnailCtrStrategy": "Why this prompt works for CTR",
  "mobileReadabilityStrategy": "How to ensure it looks good on mobile",
  "environment": "Environment details",
  "mood": "Mood details",
  "depthOfField": "DOF details",
  "focus": "Focus details"
}`;
    
    await updateProgress(50, "Generating AI Image Prompt package...");
    const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    const parsed = JSON.parse(result.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim());
    
    const updatedThumbnail = {
      ...thumbnail,
      ...parsed
    };

    // Automatically run the quality analyzer
    await updateProgress(70, "Running automatic Quality Analysis on generated prompt...");
    const analysisPrompt = `Analyze this YouTube Thumbnail Prompt package.
Score each metric from 0-100 based on standard YouTube best practices.
Thumbnail Data: ${JSON.stringify(updatedThumbnail)}

Return ONLY JSON matching exactly:
{
  "readinessScore": {
    "ctrPotential": number,
    "curiosity": number,
    "emotionalImpact": number,
    "visualSimplicity": number,
    "textReadability": number,
    "mobileVisibility": number,
    "colorContrast": number,
    "faceVisibility": number,
    "focusQuality": number,
    "overallScore": number
  }
}`;
    const analysisResult = await callAI(analysisPrompt, { mode: "text", responseFormat: "json_object" });
    const analysisParsed = JSON.parse(analysisResult.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim());
    
    updatedThumbnail.readinessScore = analysisParsed.readinessScore;

    await updateProgress(100, "Thumbnail prompt and analysis complete.");
    return { success: true, thumbnail: updatedThumbnail };
  });

  registerJobHandler("studio_analyze_thumbnail_quality", async (jobId, payload, updateProgress) => {
    const { thumbnail } = payload;
    await updateProgress(30, "Analyzing Thumbnail Quality...");
    const analysisPrompt = `Analyze this YouTube Thumbnail Concept and AI Prompt package.
Score each metric from 0-100 based on standard YouTube best practices.
Thumbnail Data: ${JSON.stringify(thumbnail)}

Return ONLY JSON matching exactly:
{
  "readinessScore": {
    "ctrPotential": number,
    "curiosity": number,
    "emotionalImpact": number,
    "visualSimplicity": number,
    "textReadability": number,
    "mobileVisibility": number,
    "colorContrast": number,
    "faceVisibility": number,
    "focusQuality": number,
    "overallScore": number
  }
}`;
    const analysisResult = await callAI(analysisPrompt, { mode: "text", responseFormat: "json_object" });
    const analysisParsed = JSON.parse(analysisResult.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim());
    
    await updateProgress(100, "Thumbnail quality analysis complete.");
    return { success: true, readinessScore: analysisParsed.readinessScore };
  });

  registerJobHandler("studio_generate_thumbnail_preview", async (jobId, payload, updateProgress) => {
    const { thumbnail } = payload;
    await updateProgress(30, "Initializing agnostic image generation provider...");
    
    const { generateAIImage } = await import("@/lib/ai/image-provider");

    await updateProgress(60, "Generating image preview...");
    
    const imageResult = await generateAIImage({
      prompt: thumbnail.imagePrompt || thumbnail.title,
      negativePrompt: thumbnail.negativePrompt,
      aspectRatio: thumbnail.aspectRatio || "16:9"
    });

    await updateProgress(100, "Preview generated successfully.");
    return { 
      success: true, 
      generatedImageUrl: imageResult.url,
      generatedAt: imageResult.createdAt
    };
  });

  registerJobHandler("studio_analyze_production", async (jobId, payload, updateProgress) => {
    const { production } = payload;
    await updateProgress(30, "Evaluating production readiness...");
    const prompt = `Evaluate these production assets. Return JSON matching: { readinessScore: { overallScore, thumbnailScore, titleScore, descriptionScore, seoScore, retentionScore, ctrPrediction, publishingReadiness: "Excellent"|"Good"|"Average"|"Poor", missingAssets: [], improvementSuggestions: [] } }. Production Data: ${JSON.stringify(production)}`;
    const result = await callAI(prompt, { mode: "text", responseFormat: "json_object" });
    const parsed = JSON.parse(result.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim());
    await updateProgress(100, "Evaluation complete.");
    return { success: true, readinessScore: parsed.readinessScore };
  });
}

