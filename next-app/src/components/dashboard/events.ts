"use client";

import { useEffect } from "react";

export type WorkspaceEventType = 
  | "RESEARCH_STARTED"
  | "RESEARCH_COMPLETED"
  | "ANALYSIS_UPDATED"
  | "CHANNEL_SELECTED"
  | "REPORT_GENERATED"
  | "EXPORT_FINISHED"
  | "RESEARCH_ITEM_SAVED"
  | "DEEP_INTELLIGENCE_GENERATED"
  | "FORMULA_EXTRACTED"
  | "TITLE_INTELLIGENCE_GENERATED"
  | "THUMBNAIL_INTELLIGENCE_GENERATED"
  | "SYNERGY_INTELLIGENCE_GENERATED"
  | "STRATEGY_GENERATED"
  | "navigate";

export interface WorkspaceEventPayload {
  RESEARCH_STARTED: { sessionId: string };
  RESEARCH_COMPLETED: { sessionId: string };
  ANALYSIS_UPDATED: { itemId: string; type: string };
  CHANNEL_SELECTED: { channelId: string };
  REPORT_GENERATED: { reportId: string; channelId?: string };
  EXPORT_FINISHED: { fileUrl: string };
  RESEARCH_ITEM_SAVED: { id: string; type: string };
  DEEP_INTELLIGENCE_GENERATED: { id: string; channelId: string };
  FORMULA_EXTRACTED: { id: string; category: string };
  TITLE_INTELLIGENCE_GENERATED: { id: string; channelId: string };
  THUMBNAIL_INTELLIGENCE_GENERATED: { id: string; channelId: string };
  SYNERGY_INTELLIGENCE_GENERATED: { id: string; channelId: string };
  STRATEGY_GENERATED: { id: string; channelId: string };
  navigate: string;
}

type EventCallback<T extends WorkspaceEventType> = (payload: WorkspaceEventPayload[T]) => void;

class EventBus {
  private target: EventTarget;

  constructor() {
    this.target = new EventTarget();
  }

  emit<T extends WorkspaceEventType>(type: T, payload: WorkspaceEventPayload[T]) {
    const event = new CustomEvent(type, { detail: payload });
    this.target.dispatchEvent(event);
  }

  subscribe<T extends WorkspaceEventType>(type: T, callback: EventCallback<T>) {
    const handler = (event: Event) => {
      callback((event as CustomEvent).detail);
    };
    this.target.addEventListener(type, handler);
    return () => this.target.removeEventListener(type, handler);
  }
}

export const workspaceEvents = new EventBus();

// React Hook for easy subscription
export function useWorkspaceEvent<T extends WorkspaceEventType>(type: T, callback: EventCallback<T>) {
  useEffect(() => {
    return workspaceEvents.subscribe(type, callback);
  }, [type, callback]);
}
