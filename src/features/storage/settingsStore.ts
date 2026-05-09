import { z } from "zod";
import type { CitationStyle } from "../export/citations";

const settingsKey = "research-flow-settings";

export const appSettingsSchema = z.object({
  citationStyle: z.enum(["apa", "mla", "chicago"]),
  useDeepEmbeddings: z.boolean(),
  autoAnalyze: z.boolean()
});

export type AppSettings = z.infer<typeof appSettingsSchema>;

export const defaultSettings: AppSettings = {
  citationStyle: "apa",
  useDeepEmbeddings: false,
  autoAnalyze: true
};

export function loadSettings(): AppSettings {
  const raw = window.localStorage.getItem(settingsKey);
  if (!raw) return defaultSettings;

  try {
    const parsed = appSettingsSchema.partial().safeParse(JSON.parse(raw));
    if (!parsed.success) return defaultSettings;
    return { ...defaultSettings, ...parsed.data };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: AppSettings) {
  window.localStorage.setItem(settingsKey, JSON.stringify(settings));
}

export function clearSettings() {
  window.localStorage.removeItem(settingsKey);
}

export function isCitationStyle(value: string): value is CitationStyle {
  return value === "apa" || value === "mla" || value === "chicago";
}
