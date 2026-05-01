import type { AppliedRecord } from "../types";

const APPLIED_KEY = "myjobboard:applied:v1";
const SETTINGS_KEY = "myjobboard:settings:v1";
const PASSED_KEY = "myjobboard:passed:v1";

export interface BoardSettings {
  /** Auto-trigger assisted flow when score >= threshold */
  autoAssistThreshold: number | null;
  /** If false, UI only notifies without opening tabs */
  openApplyTabs: boolean;
}

const defaultSettings: BoardSettings = {
  autoAssistThreshold: 72,
  openApplyTabs: true,
};

export function loadSettings(): BoardSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const p = JSON.parse(raw) as Partial<BoardSettings>;
    const th = p.autoAssistThreshold;
    const autoAssistThreshold =
      typeof th === "number"
        ? th
        : th === null
          ? null
          : defaultSettings.autoAssistThreshold;
    return {
      autoAssistThreshold,
      openApplyTabs:
        typeof p.openApplyTabs === "boolean"
          ? p.openApplyTabs
          : defaultSettings.openApplyTabs,
    };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(s: BoardSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function loadApplied(): AppliedRecord[] {
  try {
    const raw = localStorage.getItem(APPLIED_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as AppliedRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveApplied(rows: AppliedRecord[]) {
  localStorage.setItem(APPLIED_KEY, JSON.stringify(rows));
}

export function loadPassed(): string[] {
  try {
    const raw = localStorage.getItem(PASSED_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function savePassed(ids: string[]) {
  localStorage.setItem(PASSED_KEY, JSON.stringify(ids));
}
