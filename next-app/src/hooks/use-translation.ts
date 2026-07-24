"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  TranslationRequest,
  TranslationResponse,
  BatchTranslationRequest,
  BatchTranslationResponse,
  LanguageDetectionResult,
  TranslationHistory,
  TranslationHistoryFilters,
} from "@/lib/translation/translation";

// ─────────────────────────────────────────────────────────────────────────────
// API calls
// ─────────────────────────────────────────────────────────────────────────────

async function apiTranslate(request: TranslationRequest): Promise<TranslationResponse> {
  const res = await fetch("/api/translation/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Translation failed");
  }
  return res.json();
}

async function apiBatchTranslate(request: BatchTranslationRequest): Promise<BatchTranslationResponse> {
  const res = await fetch("/api/translation/batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Batch translation failed");
  }
  return res.json();
}

async function apiDetectLanguage(text: string): Promise<LanguageDetectionResult> {
  const res = await fetch("/api/translation/detect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Language detection failed");
  }
  return res.json();
}

async function apiFetchHistory(
  filters: TranslationHistoryFilters
): Promise<{ history: TranslationHistory[]; count: number }> {
  const params = new URLSearchParams();
  if (filters.sourceLanguage) params.set("sourceLanguage", filters.sourceLanguage);
  if (filters.targetLanguage) params.set("targetLanguage", filters.targetLanguage);
  if (filters.mode) params.set("mode", filters.mode);
  if (filters.contentType) params.set("contentType", filters.contentType);
  if (filters.limit !== undefined) params.set("limit", String(filters.limit));
  if (filters.offset !== undefined) params.set("offset", String(filters.offset));

  const res = await fetch(`/api/translation/history?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

async function apiDeleteHistory(id: string): Promise<void> {
  const res = await fetch(`/api/translation/history?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete history entry");
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useTranslation() {
  const queryClient = useQueryClient();

  const translateMutation = useMutation<TranslationResponse, Error, TranslationRequest>({
    mutationFn: apiTranslate,
    onSuccess: () => {
      // Invalidate history after successful translation
      queryClient.invalidateQueries({ queryKey: ["translation-history"] });
    },
  });

  const batchTranslateMutation = useMutation<BatchTranslationResponse, Error, BatchTranslationRequest>({
    mutationFn: apiBatchTranslate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translation-history"] });
    },
  });

  const detectLanguageMutation = useMutation<LanguageDetectionResult, Error, string>({
    mutationFn: apiDetectLanguage,
  });

  const deleteHistoryMutation = useMutation<void, Error, string>({
    mutationFn: apiDeleteHistory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translation-history"] });
    },
  });

  return {
    // Single translation
    translate: translateMutation.mutateAsync,
    isTranslating: translateMutation.isPending,
    translationResult: translateMutation.data,
    translationError: translateMutation.error,

    // Batch translation
    batchTranslate: batchTranslateMutation.mutateAsync,
    isBatchTranslating: batchTranslateMutation.isPending,
    batchResult: batchTranslateMutation.data,
    batchError: batchTranslateMutation.error,

    // Language detection
    detectLanguage: detectLanguageMutation.mutateAsync,
    isDetecting: detectLanguageMutation.isPending,
    detectionResult: detectLanguageMutation.data,

    // History management
    deleteHistory: deleteHistoryMutation.mutateAsync,
    isDeletingHistory: deleteHistoryMutation.isPending,

    // Reset
    reset: () => {
      translateMutation.reset();
      batchTranslateMutation.reset();
    },
  };
}

/**
 * Hook for fetching translation history with filters.
 */
export function useTranslationHistory(filters: TranslationHistoryFilters = {}) {
  return useQuery({
    queryKey: ["translation-history", filters],
    queryFn: () => apiFetchHistory(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
