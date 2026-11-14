import type { ResourceConfiguration, ResourceType } from "@prisma/client";

// Kept apart from components/resource.tsx so lists and filters can use them
// without bundling the Resource page (and its markdown renderer).

export const ResourceTypeLabels: Record<ResourceType, string> = {
  EXERCISE: "🚀 Warm-up / Exercise",
  SHORT_FORM: "⚡️ Short Form Game",
  LONG_FORM: "🍿 Long Form Format",
};

export const ResourceConfigurationLabels: Record<
  ResourceConfiguration,
  string
> = {
  SCENE: "🎭 Scenework",
  BACKLINE: "👥 Backline",
  WHOLE_CLASS: "♾️ Whole Group",
  SOLO: "🧍 Solo",
  PAIRS: "👯 Pairs",
  GROUPS: "👨‍👨‍👦 Groups",
  CIRCLE: "⭕️ Circle",
};
