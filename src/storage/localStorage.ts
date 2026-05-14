import { MONTHLY_GOAL_DAYS } from "../constants/options";
import type { AppData, CloudSyncPreferences, StudySession } from "../types/study";
import { getPlannedMinutes, normalizeIELTSPracticeType, normalizePracticeMode } from "../utils/practiceMode";

const STORAGE_KEY = "xiaonituan-english-camp-v1";
const CLOUD_PREFERENCES_KEY = "xiaonituan-english-camp-cloud-v1";

export function getDefaultAppData(): AppData {
  return {
    sessions: [],
    sentenceBank: [],
    recordings: [],
    monthlyGoalDays: MONTHLY_GOAL_DAYS,
  };
}

function normalizeStoredSession(session: StudySession): StudySession {
  const practiceMode = normalizePracticeMode(session.practiceMode);
  const ieltsPracticeType = normalizeIELTSPracticeType(practiceMode, session.ieltsPracticeType);

  return {
    ...session,
    practiceMode,
    ieltsPracticeType,
    plannedMinutes: session.plannedMinutes || getPlannedMinutes(practiceMode, ieltsPracticeType),
  };
}

export function loadAppData(): AppData {
  if (typeof window === "undefined") {
    return getDefaultAppData();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultAppData();
    }

    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      ...getDefaultAppData(),
      ...parsed,
      sessions: (parsed.sessions ?? []).map((session) => normalizeStoredSession(session)),
      sentenceBank: parsed.sentenceBank ?? [],
      recordings: parsed.recordings ?? [],
      monthlyGoalDays: parsed.monthlyGoalDays ?? MONTHLY_GOAL_DAYS,
    };
  } catch {
    return getDefaultAppData();
  }
}

export function saveAppData(data: AppData): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function loadCloudSyncPreferences(): CloudSyncPreferences {
  if (typeof window === "undefined") {
    return { autoSyncEnabled: false };
  }

  try {
    const raw = window.localStorage.getItem(CLOUD_PREFERENCES_KEY);
    if (!raw) {
      return { autoSyncEnabled: false };
    }

    const parsed = JSON.parse(raw) as Partial<CloudSyncPreferences>;
    return {
      autoSyncEnabled: parsed.autoSyncEnabled ?? false,
      lastSyncedAt: parsed.lastSyncedAt,
    };
  } catch {
    return { autoSyncEnabled: false };
  }
}

export function saveCloudSyncPreferences(preferences: CloudSyncPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CLOUD_PREFERENCES_KEY, JSON.stringify(preferences));
}
