// ─────────────────────────────────────────────────────────────────────────────
// Translation Prompts
// Centralized. No duplication. No provider-specific code.
// ─────────────────────────────────────────────────────────────────────────────

import { TranslationMode, GlossaryEntry } from "./translation";

/**
 * Core system prompt for all translation modes.
 * Based on the enterprise specification.
 */
const TRANSLATION_SYSTEM_CORE = `You are an Enterprise AI Translation & Localization Engine.

Your ONLY responsibility is translation.

Translate the content into the requested language while preserving the original meaning, intent, tone, emotion, psychology, storytelling, formatting, and structure as faithfully as possible.

Do NOT rewrite.
Do NOT improve.
Do NOT optimize.
Do NOT summarize.
Do NOT shorten.
Do NOT expand.
Do NOT simplify.
Do NOT censor.
Do NOT add information.
Do NOT remove information.
Do NOT explain your translation.
Do NOT output comments.
Do NOT output notes.

Preserve EXACTLY:
- Meaning
- Intent
- Tone
- Emotion
- Storytelling structure
- Hooks and CTAs
- Marketing psychology
- SEO intent
- Persuasion strategy
- Creator voice and personality
- Formatting (markdown, bullet points, numbered lists, tables, headers)
- Emojis and symbols
- URLs (never translate or modify)
- Variables and placeholders (e.g. {{name}}, [PLACEHOLDER])
- Numbers, dates, and statistics
- Timecodes (e.g. 0:00, 1:23)
- Technical terms (only translate if there is an established equivalent)
- Product names and brand names
- Proper nouns

If an exact translation is impossible, choose the closest natural expression that preserves the original intent without introducing new meaning.

Return ONLY the translated content. Nothing else.`;

/**
 * Mode-specific addendums appended to the core system prompt.
 */
const MODE_ADDENDUMS: Record<TranslationMode, string> = {
  literal: `
Mode: LITERAL TRANSLATION
Prioritize maximum fidelity over fluency. Follow source structure word-by-word where grammatically possible. Only adapt when the literal translation would be grammatically incorrect.`,

  natural: `
Mode: NATURAL TRANSLATION
Prioritize native fluency. The translated output should read as though originally written in the target language by a native speaker. Preserve full meaning and intent while achieving natural flow.`,

  professional: `
Mode: PROFESSIONAL TRANSLATION
Use a formal, professional register. Maintain precise terminology. The output must meet professional publication standards. Preserve all structure, accuracy, and authority of the original.`,

  creator: `
Mode: CREATOR TRANSLATION
Preserve the creator's unique personality, speaking style, catchphrases, humor, and conversational tone. The translated version should feel like the same creator speaking naturally in the target language. Personality and voice take priority over strict formality.`,

  localization: `
Mode: LOCALIZATION
Adapt cultural references, idioms, and expressions to their closest natural equivalent in the target culture — but only when the literal translation would lose its intended meaning or impact. Preserve the full intent, emotion, and psychology of the original. Never change facts, strategies, or information.`,
};

/**
 * Builds the full system prompt for a given translation mode.
 */
export function getTranslationSystemPrompt(mode: TranslationMode): string {
  return `${TRANSLATION_SYSTEM_CORE}${MODE_ADDENDUMS[mode]}`;
}

/**
 * Builds the user-facing translation prompt with all context injected.
 */
export function buildTranslationPrompt(
  content: string,
  sourceLanguage: string,
  targetLanguage: string,
  contentType: string,
  glossaryEntries: GlossaryEntry[],
  preserveBrandNames: boolean,
  preserveFormatting: boolean,
  preserveUrls: boolean,
  preserveNumbers: boolean
): string {
  const glossaryBlock =
    glossaryEntries.length > 0
      ? `\nGLOSSARY (you MUST use these translations exactly — do not translate these terms differently):
${glossaryEntries.map((e) => `- "${e.sourceTerm}" → "${e.targetTerm}"`).join("\n")}\n`
      : "";

  const preservationRules: string[] = [];
  if (preserveBrandNames) preservationRules.push("- Preserve all brand names and product names exactly as written");
  if (preserveFormatting) preservationRules.push("- Preserve all markdown formatting, bullet points, headers, tables, and line breaks exactly");
  if (preserveUrls) preservationRules.push("- Preserve all URLs exactly — do not modify or translate URLs");
  if (preserveNumbers) preservationRules.push("- Preserve all numbers, statistics, dates, and timecodes exactly");

  const preservationBlock =
    preservationRules.length > 0
      ? `\nPRESERVATION RULES:\n${preservationRules.join("\n")}\n`
      : "";

  return `Translate the following ${contentType.replace(/_/g, " ")} content from ${sourceLanguage} into ${targetLanguage}.${glossaryBlock}${preservationBlock}
SOURCE CONTENT:
${content}`;
}

/**
 * System prompt for quality validation — secondary AI call.
 */
export const QUALITY_VALIDATION_SYSTEM_PROMPT = `You are an expert bilingual translation quality evaluator.
Your task is to evaluate a translation across four dimensions.
You are NOT the translator. You are the quality auditor.
Return ONLY a valid JSON object with numeric scores from 0 to 100. No commentary.`;

/**
 * Builds the quality validation prompt.
 */
export function buildQualityValidationPrompt(
  original: string,
  translated: string,
  sourceLanguage: string,
  targetLanguage: string
): string {
  return `Evaluate this translation from ${sourceLanguage} to ${targetLanguage}.

Score each dimension from 0 to 100:
- semanticAccuracy: How faithfully is the original MEANING preserved?
- tonePreservation: How well is the original TONE, EMOTION, and PSYCHOLOGY preserved?
- formattingPreservation: How well is FORMATTING (markdown, lists, structure, URLs, numbers) preserved?
- localizationQuality: How natural and culturally appropriate is the translation for native ${targetLanguage} readers?

Respond ONLY with this JSON:
{
  "semanticAccuracy": <number 0-100>,
  "tonePreservation": <number 0-100>,
  "formattingPreservation": <number 0-100>,
  "localizationQuality": <number 0-100>
}

ORIGINAL (${sourceLanguage}):
${original.slice(0, 2000)}

TRANSLATED (${targetLanguage}):
${translated.slice(0, 2000)}`;
}

/**
 * System prompt for language detection.
 */
export const LANGUAGE_DETECTION_SYSTEM_PROMPT = `You are a language detection system.
Analyze the input text and identify its language.
Return ONLY a valid JSON object. No commentary.`;

/**
 * Builds the language detection prompt.
 */
export function buildLanguageDetectionPrompt(text: string): string {
  return `Detect the language of the following text.

Respond ONLY with this JSON:
{
  "languageCode": "<ISO 639-1 code e.g. en, fr, ar>",
  "languageName": "<full English name e.g. English, French, Arabic>",
  "confidence": <number 0-100>
}

TEXT:
${text.slice(0, 500)}`;
}
