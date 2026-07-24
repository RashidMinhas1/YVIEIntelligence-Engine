import { LucideIcon, Type, FileText, Anchor, Target, Settings, AlignLeft, Layers, PenTool, LayoutTemplate, Activity, Sparkles, Hand, Zap, ShieldAlert, Key } from "lucide-react";

export type FieldType = "text" | "textarea" | "markdown" | "select" | "number" | "tags" | "url";

export interface FieldConfig {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
  description?: string;
}

export interface KnowledgeCategoryConfig {
  id: string;
  label: string;
  icon: any; // LucideIcon type or string
  description: string;
  builderSection: boolean;
  scriptWriterSection: boolean;
  fields: FieldConfig[];
}

export const KNOWLEDGE_CATEGORIES: KnowledgeCategoryConfig[] = [
  {
    id: "hook",
    label: "Hooks",
    icon: Sparkles,
    description: "Attention-grabbing patterns for the first 5 seconds.",
    builderSection: true,
    scriptWriterSection: true,
    fields: [
      { id: "hookText", label: "Hook Text", type: "textarea", required: true, placeholder: "The exact hook text..." },
      { id: "whyItWorks", label: "Why It Works", type: "textarea", placeholder: "Psychological breakdown of why this retains viewers." },
      { id: "psychology", label: "Psychology Trigger", type: "text", placeholder: "e.g., Curiosity Gap, Fear of Missing Out" },
    ],
  },
  {
    id: "title_format",
    label: "Title Formats",
    icon: Type,
    description: "Reusable title structures and formulas.",
    builderSection: true,
    scriptWriterSection: true,
    fields: [
      { id: "template", label: "Title Template", type: "text", required: true, placeholder: "e.g., How I [Achievement] Without [Pain Point]" },
      { id: "example", label: "Example Title", type: "text", placeholder: "How I Made $1M Without Writing Code" },
      { id: "emotionalTrigger", label: "Emotional Trigger", type: "text" },
    ],
  },
  {
    id: "script_format",
    label: "Script Formats",
    icon: FileText,
    description: "Full script blueprints.",
    builderSection: false,
    scriptWriterSection: false, // Handled separately or as a full blueprint
    fields: [
      { id: "blueprint", label: "Script Blueprint", type: "textarea", required: true },
      { id: "retentionPattern", label: "Retention Pattern", type: "text" },
    ],
  },
  {
    id: "cta",
    label: "CTA",
    icon: Target,
    description: "Call to Action structures.",
    builderSection: true,
    scriptWriterSection: true,
    fields: [
      { id: "ctaText", label: "CTA Text", type: "textarea", required: true },
      { id: "placement", label: "Placement", type: "select", options: ["Intro", "Mid-roll", "Outro", "Pinned Comment"] },
    ],
  },
  {
    id: "thumbnail_format",
    label: "Thumbnail Formats",
    icon: LayoutTemplate,
    description: "Visual strategies for CTR.",
    builderSection: true,
    scriptWriterSection: true,
    fields: [
      { id: "style", label: "Style", type: "text", placeholder: "e.g., High Contrast, Minimalist" },
      { id: "emotion", label: "Target Emotion", type: "text" },
      { id: "textElements", label: "Text Elements", type: "textarea" },
    ],
  },
  {
    id: "report",
    label: "Reports",
    icon: Activity,
    description: "Full competitor analysis reports.",
    builderSection: false,
    scriptWriterSection: false,
    fields: [
      { id: "summary", label: "Summary", type: "markdown", required: true },
      { id: "analysis", label: "Detailed Analysis", type: "markdown" },
    ],
  },
  {
    id: "prompt",
    label: "Prompts",
    icon: PenTool,
    description: "AI prompt templates.",
    builderSection: true,
    scriptWriterSection: true,
    fields: [
      { id: "promptText", label: "Prompt Text", type: "textarea", required: true },
      { id: "variables", label: "Variables", type: "text", placeholder: "Comma separated variables e.g. topic, tone" },
      { id: "instructions", label: "Instructions", type: "textarea" },
    ],
  },
  {
    id: "story_structure",
    label: "Story Structures",
    icon: Layers,
    description: "Narrative arcs (e.g., Hero's Journey).",
    builderSection: true,
    scriptWriterSection: true,
    fields: [
      { id: "structure", label: "Structure Markdown", type: "markdown", required: true },
    ],
  },
  {
    id: "retention_pattern",
    label: "Retention Patterns",
    icon: ShieldAlert,
    description: "Techniques to hold audience attention.",
    builderSection: true,
    scriptWriterSection: true,
    fields: [
      { id: "pattern", label: "Pattern Details", type: "textarea", required: true },
    ],
  },
  {
    id: "tone",
    label: "Tone Library",
    icon: Settings,
    description: "Voice and tone configurations.",
    builderSection: true,
    scriptWriterSection: true,
    fields: [
      { id: "toneDescription", label: "Tone Description", type: "textarea", required: true },
      { id: "formality", label: "Formality", type: "select", options: ["Casual", "Professional", "Academic", "Conversational"] },
    ],
  },
  {
    id: "opening",
    label: "Openings",
    icon: AlignLeft,
    description: "First 30 seconds structure.",
    builderSection: true,
    scriptWriterSection: true,
    fields: [
      { id: "openingText", label: "Opening Content", type: "textarea", required: true },
    ],
  },
  {
    id: "closing",
    label: "Closings",
    icon: Hand,
    description: "Ending structures.",
    builderSection: true,
    scriptWriterSection: true,
    fields: [
      { id: "closingText", label: "Closing Content", type: "textarea", required: true },
    ],
  },
  {
    id: "transition",
    label: "Transitions",
    icon: Zap,
    description: "Flow between segments.",
    builderSection: true,
    scriptWriterSection: false,
    fields: [
      { id: "transitionDetails", label: "Transition Example", type: "textarea", required: true },
    ],
  },
  {
    id: "emotional_trigger",
    label: "Emotional Triggers",
    icon: Sparkles,
    description: "Elicit specific feelings.",
    builderSection: true,
    scriptWriterSection: false,
    fields: [
      { id: "triggerDetails", label: "Trigger Explanation", type: "textarea", required: true },
    ],
  },
  {
    id: "curiosity_gap",
    label: "Curiosity Gaps",
    icon: Key,
    description: "Create desire for answers.",
    builderSection: true,
    scriptWriterSection: false,
    fields: [
      { id: "gapDetails", label: "Gap Strategy", type: "textarea", required: true },
    ],
  }
];
