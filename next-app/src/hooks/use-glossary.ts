"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GlossaryEntry, GlossaryFilters } from "@/lib/translation/translation";

// ─────────────────────────────────────────────────────────────────────────────
// API calls
// ─────────────────────────────────────────────────────────────────────────────

async function apiFetchGlossary(
  filters: GlossaryFilters
): Promise<{ glossary: GlossaryEntry[]; count: number }> {
  const params = new URLSearchParams();
  if (filters.sourceLanguage) params.set("sourceLanguage", filters.sourceLanguage);
  if (filters.targetLanguage) params.set("targetLanguage", filters.targetLanguage);
  if (filters.query) params.set("query", filters.query);

  const res = await fetch(`/api/translation/glossary?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch glossary");
  return res.json();
}

async function apiCreateGlossaryEntry(
  entry: Omit<GlossaryEntry, "id" | "createdAt" | "updatedAt">
): Promise<GlossaryEntry> {
  const res = await fetch("/api/translation/glossary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entry),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Failed to create glossary entry");
  }
  return res.json();
}

async function apiUpdateGlossaryEntry(
  update: Partial<GlossaryEntry> & { id: string }
): Promise<GlossaryEntry> {
  const res = await fetch("/api/translation/glossary", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(update),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Failed to update glossary entry");
  }
  return res.json();
}

async function apiDeleteGlossaryEntry(id: string): Promise<void> {
  const res = await fetch(`/api/translation/glossary?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete glossary entry");
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useGlossary(filters: GlossaryFilters = {}) {
  const queryClient = useQueryClient();

  const glossaryQuery = useQuery({
    queryKey: ["translation-glossary", filters],
    queryFn: () => apiFetchGlossary(filters),
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation<
    GlossaryEntry,
    Error,
    Omit<GlossaryEntry, "id" | "createdAt" | "updatedAt">
  >({
    mutationFn: apiCreateGlossaryEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translation-glossary"] });
    },
  });

  const updateMutation = useMutation<
    GlossaryEntry,
    Error,
    Partial<GlossaryEntry> & { id: string }
  >({
    mutationFn: apiUpdateGlossaryEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translation-glossary"] });
    },
  });

  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: apiDeleteGlossaryEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["translation-glossary"] });
    },
  });

  return {
    glossary: glossaryQuery.data?.glossary ?? [],
    count: glossaryQuery.data?.count ?? 0,
    isLoading: glossaryQuery.isLoading,
    error: glossaryQuery.error,

    createGlossaryEntry: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    updateGlossaryEntry: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    deleteGlossaryEntry: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}
