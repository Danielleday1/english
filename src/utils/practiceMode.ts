import type { IELTSPracticeType, PracticeMode, StudySession } from "../types/study";

export type PracticeStepId =
  | "material"
  | "warmup"
  | "blindListening"
  | "intensiveListening"
  | "sentences"
  | "shadowing"
  | "workplaceSpeaking"
  | "ieltsPracticeChoice"
  | "ieltsAddonChoice"
  | "ieltsListening"
  | "ieltsSpeaking"
  | "review";

export interface PracticeStepConfig {
  id: PracticeStepId;
  title: string;
  minutes: number;
}

export const PRACTICE_MODE_OPTIONS: Array<{
  id: PracticeMode;
  title: string;
  description: string;
  estimatedMinutes: number;
}> = [
  {
    id: "workplace",
    title: "职场英语主线",
    description: "适合日常提升真实英语听力、跟读、复述和职场表达能力。",
    estimatedMinutes: 75,
  },
  {
    id: "ielts",
    title: "雅思专项",
    description: "适合练 IELTS 听力题型、错题复盘和口语 Part 训练。",
    estimatedMinutes: 60,
  },
  {
    id: "mixed",
    title: "混合训练",
    description: "适合时间充足时，同时练真实材料和雅思专项，但不追求塞满所有任务。",
    estimatedMinutes: 120,
  },
];

export const IELTS_PRACTICE_TYPE_OPTIONS: Array<{ value: IELTSPracticeType; label: string; minutes: number }> = [
  { value: "listening", label: "只练雅思听力", minutes: 35 },
  { value: "speaking", label: "只练雅思口语", minutes: 30 },
  { value: "both", label: "听力 + 口语", minutes: 60 },
];

export const IELTS_ADDON_OPTIONS: Array<{ value: IELTSPracticeType; label: string }> = [
  { value: "listening", label: "加练雅思听力" },
  { value: "speaking", label: "加练雅思口语" },
];

const WORKPLACE_STEPS: PracticeStepConfig[] = [
  { id: "material", title: "输入今日材料", minutes: 5 },
  { id: "warmup", title: "热身开口", minutes: 5 },
  { id: "blindListening", title: "听后回忆关键词", minutes: 5 },
  { id: "intensiveListening", title: "精听理解", minutes: 15 },
  { id: "sentences", title: "今日 3 句", minutes: 10 },
  { id: "shadowing", title: "跟读打卡", minutes: 15 },
  { id: "workplaceSpeaking", title: "职场口语输出", minutes: 15 },
  { id: "review", title: "今日复盘", minutes: 5 },
];

const MIXED_BASE_STEPS: PracticeStepConfig[] = [
  { id: "material", title: "输入今日材料", minutes: 5 },
  { id: "blindListening", title: "听后回忆关键词", minutes: 10 },
  { id: "intensiveListening", title: "精听理解", minutes: 25 },
  { id: "sentences", title: "今日 3 句", minutes: 15 },
  { id: "shadowing", title: "跟读打卡", minutes: 20 },
  { id: "workplaceSpeaking", title: "职场口语输出", minutes: 15 },
  { id: "ieltsAddonChoice", title: "雅思专项加练", minutes: 5 },
];

export function normalizePracticeMode(mode?: PracticeMode): PracticeMode {
  return mode ?? "workplace";
}

export function normalizeIELTSPracticeType(mode: PracticeMode, type?: IELTSPracticeType): IELTSPracticeType {
  if (mode === "workplace") {
    return "none";
  }

  if (mode === "ielts") {
    return type && type !== "none" ? type : "both";
  }

  return type === "speaking" ? "speaking" : "listening";
}

export function getPracticeSteps(mode: PracticeMode, ieltsPracticeType: IELTSPracticeType): PracticeStepConfig[] {
  if (mode === "workplace") {
    return WORKPLACE_STEPS;
  }

  if (mode === "ielts") {
    const steps: PracticeStepConfig[] = [{ id: "ieltsPracticeChoice", title: "选择雅思训练类型", minutes: 0 }];
    if (ieltsPracticeType === "listening" || ieltsPracticeType === "both") {
      steps.push({ id: "ieltsListening", title: "雅思听力训练", minutes: 30 });
    }
    if (ieltsPracticeType === "speaking" || ieltsPracticeType === "both") {
      steps.push({ id: "ieltsSpeaking", title: "雅思口语训练", minutes: 25 });
    }
    steps.push({ id: "review", title: "今日复盘", minutes: 5 });
    return steps;
  }

  const steps = [...MIXED_BASE_STEPS];
  if (ieltsPracticeType === "speaking") {
    steps.push({ id: "ieltsSpeaking", title: "雅思口语训练", minutes: 25 });
  } else {
    steps.push({ id: "ieltsListening", title: "雅思听力训练", minutes: 25 });
  }
  steps.push({ id: "review", title: "今日复盘", minutes: 5 });
  return steps;
}

export function getPlannedMinutes(mode: PracticeMode, ieltsPracticeType: IELTSPracticeType): number {
  if (mode === "workplace") {
    return 75;
  }

  if (mode === "ielts") {
    if (ieltsPracticeType === "listening") {
      return 35;
    }
    if (ieltsPracticeType === "speaking") {
      return 30;
    }
    return 60;
  }

  return 120;
}

export function normalizePracticeSession(session: StudySession): StudySession {
  const practiceMode = normalizePracticeMode(session.practiceMode);
  const ieltsPracticeType = normalizeIELTSPracticeType(practiceMode, session.ieltsPracticeType);
  const stepIds = new Set(getPracticeSteps(practiceMode, ieltsPracticeType).map((step) => step.id));

  return {
    ...session,
    practiceMode,
    ieltsPracticeType,
    plannedMinutes: getPlannedMinutes(practiceMode, ieltsPracticeType),
    completedSteps: session.completedSteps.filter((stepId) => stepIds.has(stepId as PracticeStepId)),
  };
}

export function getPracticeSummary(session: StudySession): { label: string; detail: string } {
  const mode = normalizePracticeMode(session.practiceMode);

  if (mode === "ielts") {
    return {
      label: "雅思训练",
      detail: "听力做题 / 口语录音 / 错题复盘",
    };
  }

  if (mode === "mixed") {
    return {
      label: "混合训练",
      detail: "职场英语 + 雅思专项加练",
    };
  }

  return {
    label: "职场英语",
    detail: "材料精听 + 跟读 + 口语复述",
  };
}
