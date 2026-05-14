import { STEP_CONFIG } from "../constants/options";
import type {
  DailyReview,
  IELTSListeningRecord,
  IELTSSpeakingRecord,
  IntensiveListeningRecord,
  Material,
  Sentence,
  ShadowingRecord,
  StudySession,
  WarmupRecord,
  WorkplaceSpeakingRecord,
} from "../types/study";
import { getLocalDateKey } from "./date";
import { getPracticeSteps, getPlannedMinutes, normalizeIELTSPracticeType, normalizePracticeMode } from "./practiceMode";

export function createId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

export function createEmptyMaterial(date = new Date()): Material {
  const now = date.toISOString();
  return {
    id: createId("material"),
    title: "",
    url: "",
    type: "podcast",
    topic: "ai",
    difficulty: "medium",
    notes: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptyWarmup(): WarmupRecord {
  return {
    mood: "normal",
    completed: false,
  };
}

export function createEmptyIntensiveListening(): IntensiveListeningRecord {
  return {
    mainIdea: "",
    speakerPoint: "",
    unclearParts: "",
    comprehension: 50,
    vocabulary: [],
  };
}

export function createEmptySentence(sessionId: string): Sentence {
  const now = new Date().toISOString();
  return {
    id: createId("sentence"),
    sessionId,
    text: "",
    translation: "",
    scenario: "",
    tag: "product",
    mastery: "weak",
    reviewCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function createEmptyShadowingRecords(sentences: Sentence[]): ShadowingRecord[] {
  return sentences.map((sentence) => ({
    sentenceId: sentence.id,
    repeatCount: 0,
    mastery: sentence.mastery,
  }));
}

export function createEmptyWorkplaceSpeaking(): WorkplaceSpeakingRecord {
  return {
    prompt: "Summarize today’s clip and give your opinion.",
    transcript: "",
    duration: 0,
    fluencyScore: 3,
    clarityScore: 3,
    confidenceScore: 3,
  };
}

export function createEmptyIELTSListening(): IELTSListeningRecord {
  return {
    materialName: "",
    section: 1,
    questionType: "completion",
    totalQuestions: 0,
    correctAnswers: 0,
    accuracy: 0,
    errorReasons: [],
    notes: "",
    nextFocus: "",
  };
}

export function createEmptyIELTSSpeaking(): IELTSSpeakingRecord {
  return {
    part: 1,
    prompt: "",
    transcript: "",
    duration: 0,
    scores: {
      fluencyCoherence: 3,
      lexicalResource: 3,
      grammarRangeAccuracy: 3,
      pronunciation: 3,
    },
    problems: "",
    improvement: "",
  };
}

export function createEmptyDailyReview(): DailyReview {
  return {
    biggestGain: "",
    biggestProblem: "",
    tomorrowReview: "",
    mood: "normal",
  };
}

export function createEmptySession(date = new Date()): StudySession {
  const now = date.toISOString();
  const sessionId = createId("session");
  const sentences = Array.from({ length: 3 }, () => createEmptySentence(sessionId));
  const practiceMode = "workplace";
  const ieltsPracticeType = "none";

  return {
    id: sessionId,
    date: getLocalDateKey(date),
    practiceMode,
    ieltsPracticeType,
    material: createEmptyMaterial(date),
    warmup: createEmptyWarmup(),
    blindListening: {
      keywords: [],
      comprehension: 40,
      notes: "",
    },
    intensiveListening: createEmptyIntensiveListening(),
    sentences,
    shadowing: createEmptyShadowingRecords(sentences),
    workplaceSpeaking: createEmptyWorkplaceSpeaking(),
    ieltsListening: createEmptyIELTSListening(),
    ieltsSpeaking: createEmptyIELTSSpeaking(),
    review: createEmptyDailyReview(),
    plannedMinutes: getPlannedMinutes(practiceMode, ieltsPracticeType),
    actualMinutes: 0,
    completedSteps: [],
    isCompleted: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function validateUrl(value: string): "valid" | "invalid" | "empty" {
  if (!value.trim()) {
    return "empty";
  }

  try {
    new URL(value);
    return "valid";
  } catch {
    return "invalid";
  }
}

export function normalizeKeywords(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function calculateAccuracy(totalQuestions: number, correctAnswers: number): number {
  if (totalQuestions <= 0 || correctAnswers < 0) {
    return 0;
  }

  return Math.round((correctAnswers / totalQuestions) * 100);
}

export function calculateSessionProgress(session: StudySession): number {
  const practiceMode = normalizePracticeMode(session.practiceMode);
  const ieltsPracticeType = normalizeIELTSPracticeType(practiceMode, session.ieltsPracticeType);
  const steps = getPracticeSteps(practiceMode, ieltsPracticeType);
  const visibleStepIds = new Set(steps.map((step) => step.id));
  const completedVisibleSteps = session.completedSteps.filter((stepId) => visibleStepIds.has(stepId as never));
  const plannedMinutes = getPlannedMinutes(practiceMode, ieltsPracticeType);
  const stepRatio = steps.length === 0 ? 0 : completedVisibleSteps.length / steps.length;
  const minuteRatio = Math.min(getEffectiveActualMinutes(session) / plannedMinutes, 1);
  return Math.round((stepRatio * 0.7 + minuteRatio * 0.3) * 100);
}

export function getStepPlannedMinutes(stepId: string): number {
  return STEP_CONFIG.find((step) => step.id === stepId)?.minutes ?? 0;
}

export function getCompletedStepMinutes(completedSteps: string[]): number {
  return completedSteps.reduce((total, stepId) => total + getStepPlannedMinutes(stepId), 0);
}

export function getRecordedMinutes(session: StudySession): number {
  const totalSeconds = session.workplaceSpeaking.duration + session.ieltsSpeaking.duration;
  return Math.ceil(totalSeconds / 60);
}

export function getEffectiveActualMinutes(session: StudySession): number {
  const practiceMode = normalizePracticeMode(session.practiceMode);
  const ieltsPracticeType = normalizeIELTSPracticeType(practiceMode, session.ieltsPracticeType);
  const stepMinutes = getPracticeSteps(practiceMode, ieltsPracticeType).reduce((total, step) => {
    return session.completedSteps.includes(step.id) ? total + step.minutes : total;
  }, 0);
  return Math.max(session.actualMinutes, stepMinutes, getRecordedMinutes(session));
}

export function normalizeActualMinutes(session: StudySession): StudySession {
  const actualMinutes = getEffectiveActualMinutes(session);
  if (actualMinutes === session.actualMinutes) {
    return session;
  }

  return {
    ...session,
    actualMinutes,
  };
}

export function hasMeaningfulSessionContent(session: StudySession): boolean {
  return Boolean(
    session.material.title.trim() ||
      session.blindListening.keywords.length ||
      session.intensiveListening.mainIdea.trim() ||
      session.sentences.some((sentence) => sentence.text.trim()) ||
      session.workplaceSpeaking.transcript.trim() ||
      session.workplaceSpeaking.recordingId ||
      session.ieltsListening.materialName.trim() ||
      session.ieltsSpeaking.prompt.trim() ||
      session.ieltsSpeaking.transcript.trim() ||
      session.ieltsSpeaking.recordingId ||
      session.review.biggestGain.trim(),
  );
}
