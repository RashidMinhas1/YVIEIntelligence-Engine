// ─────────────────────────────────────────────────────────────────────────────
// Languages Configuration
// Scalable — never hardcoded in translation logic
// ─────────────────────────────────────────────────────────────────────────────

import { Language } from "./translation";

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: "af", name: "Afrikaans", direction: "ltr", nativeName: "Afrikaans" },
  { code: "ar", name: "Arabic", direction: "rtl", nativeName: "العربية" },
  { code: "bn", name: "Bengali", direction: "ltr", nativeName: "বাংলা" },
  { code: "bg", name: "Bulgarian", direction: "ltr", nativeName: "Български" },
  { code: "ca", name: "Catalan", direction: "ltr", nativeName: "Català" },
  { code: "zh-CN", name: "Chinese (Simplified)", direction: "ltr", nativeName: "中文(简体)" },
  { code: "zh-TW", name: "Chinese (Traditional)", direction: "ltr", nativeName: "中文(繁體)" },
  { code: "cs", name: "Czech", direction: "ltr", nativeName: "Čeština" },
  { code: "da", name: "Danish", direction: "ltr", nativeName: "Dansk" },
  { code: "nl", name: "Dutch", direction: "ltr", nativeName: "Nederlands" },
  { code: "en", name: "English", direction: "ltr", nativeName: "English" },
  { code: "fi", name: "Finnish", direction: "ltr", nativeName: "Suomi" },
  { code: "fr", name: "French", direction: "ltr", nativeName: "Français" },
  { code: "de", name: "German", direction: "ltr", nativeName: "Deutsch" },
  { code: "el", name: "Greek", direction: "ltr", nativeName: "Ελληνικά" },
  { code: "gu", name: "Gujarati", direction: "ltr", nativeName: "ગુજરાતી" },
  { code: "he", name: "Hebrew", direction: "rtl", nativeName: "עברית" },
  { code: "hi", name: "Hindi", direction: "ltr", nativeName: "हिंदी" },
  { code: "hu", name: "Hungarian", direction: "ltr", nativeName: "Magyar" },
  { code: "id", name: "Indonesian", direction: "ltr", nativeName: "Bahasa Indonesia" },
  { code: "it", name: "Italian", direction: "ltr", nativeName: "Italiano" },
  { code: "ja", name: "Japanese", direction: "ltr", nativeName: "日本語" },
  { code: "kn", name: "Kannada", direction: "ltr", nativeName: "ಕನ್ನಡ" },
  { code: "ko", name: "Korean", direction: "ltr", nativeName: "한국어" },
  { code: "ms", name: "Malay", direction: "ltr", nativeName: "Bahasa Melayu" },
  { code: "mr", name: "Marathi", direction: "ltr", nativeName: "मराठी" },
  { code: "no", name: "Norwegian", direction: "ltr", nativeName: "Norsk" },
  { code: "fa", name: "Persian", direction: "rtl", nativeName: "فارسی" },
  { code: "pl", name: "Polish", direction: "ltr", nativeName: "Polski" },
  { code: "pt-BR", name: "Portuguese (Brazil)", direction: "ltr", nativeName: "Português (Brasil)" },
  { code: "pt-PT", name: "Portuguese (Portugal)", direction: "ltr", nativeName: "Português (Portugal)" },
  { code: "pa", name: "Punjabi", direction: "ltr", nativeName: "ਪੰਜਾਬੀ" },
  { code: "ro", name: "Romanian", direction: "ltr", nativeName: "Română" },
  { code: "ru", name: "Russian", direction: "ltr", nativeName: "Русский" },
  { code: "sr", name: "Serbian", direction: "ltr", nativeName: "Српски" },
  { code: "sk", name: "Slovak", direction: "ltr", nativeName: "Slovenčina" },
  { code: "es", name: "Spanish", direction: "ltr", nativeName: "Español" },
  { code: "sw", name: "Swahili", direction: "ltr", nativeName: "Kiswahili" },
  { code: "sv", name: "Swedish", direction: "ltr", nativeName: "Svenska" },
  { code: "ta", name: "Tamil", direction: "ltr", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", direction: "ltr", nativeName: "తెలుగు" },
  { code: "th", name: "Thai", direction: "ltr", nativeName: "ภาษาไทย" },
  { code: "tr", name: "Turkish", direction: "ltr", nativeName: "Türkçe" },
  { code: "uk", name: "Ukrainian", direction: "ltr", nativeName: "Українська" },
  { code: "ur", name: "Urdu", direction: "rtl", nativeName: "اردو" },
  { code: "vi", name: "Vietnamese", direction: "ltr", nativeName: "Tiếng Việt" },
];

/**
 * Returns a language by ISO code. Returns undefined if not found.
 */
export function getLanguageByCode(code: string): Language | undefined {
  return SUPPORTED_LANGUAGES.find(
    (l) => l.code.toLowerCase() === code.toLowerCase()
  );
}

/**
 * Returns the text direction for a given language code.
 * Defaults to "ltr" for unknown codes.
 */
export function getTextDirection(code: string): "ltr" | "rtl" {
  return getLanguageByCode(code)?.direction ?? "ltr";
}
