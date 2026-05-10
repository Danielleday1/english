import { MONTHLY_GOAL_DAYS } from "../constants/options";
import type { AppData } from "../types/study";

const STORAGE_KEY = "xiaonituan-english-camp-v1";

export function getDefaultAppData(): AppData {
  return {
    sessions: [],
    sentenceBank: [],
    recordings: [],
    monthlyGoalDays: MONTHLY_GOAL_DAYS,
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
      sessions: parsed.sessions ?? [],
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
