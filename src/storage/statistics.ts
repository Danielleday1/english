import type {
  AppData,
  DashboardStats,
  ErrorReasonStat,
  Material,
  ReviewQueueData,
  Sentence,
  StudySession,
  TrendPoint,
  WeeklyReviewData,
} from "../types/study";
import { getLocalDateKey, isSameMonth, isWithinDays, startOfWeek } from "../utils/date";
import { getEffectiveActualMinutes } from "../utils/study";

export function getCompletedSessions(sessions: StudySession[]): StudySession[] {
  return sessions
    .filter((session) => session.isCompleted)
    .sort((left, right) => left.date.localeCompare(right.date));
}

export function deriveMaterials(sessions: StudySession[]): Material[] {
  return sessions
    .filter((session) => session.material.title.trim())
    .map((session) => ({
      ...session.material,
      createdAt: session.createdAt,
    }));
}

export function calculateStreak(sessions: StudySession[]): number {
  const completedDates = new Set(getCompletedSessions(sessions).map((session) => session.date));
  if (completedDates.size === 0) {
    return 0;
  }

  let streak = 0;
  const cursor = new Date();

  while (true) {
    const dateKey = getLocalDateKey(cursor);
    if (!completedDates.has(dateKey)) {
      if (streak === 0) {
        cursor.setDate(cursor.getDate() - 1);
        const previousKey = getLocalDateKey(cursor);
        if (!completedDates.has(previousKey)) {
          break;
        }
        streak += 1;
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function calculateDashboardStats(data: AppData): DashboardStats {
  const completed = getCompletedSessions(data.sessions);
  const thisMonth = completed.filter((session) => isSameMonth(session.date));
  const speakingSeconds = completed.reduce((total, session) => {
    return total + session.workplaceSpeaking.duration + session.ieltsSpeaking.duration;
  }, 0);
  const averageIELTSAccuracy =
    completed.length === 0
      ? 0
      : Math.round(
          completed.reduce((total, session) => total + session.ieltsListening.accuracy, 0) / completed.length,
        );

  const weekStart = startOfWeek();
  const weekCompletedDays = new Set(
    completed
      .filter((session) => new Date(`${session.date}T12:00:00`).getTime() >= weekStart.getTime())
      .map((session) => session.date),
  ).size;

  return {
    streakDays: calculateStreak(data.sessions),
    monthlyMinutes: thisMonth.reduce((total, session) => total + getEffectiveActualMinutes(session), 0),
    totalSpeakingMinutes: Math.round(speakingSeconds / 60),
    sentenceCount: data.sentenceBank.length,
    averageIELTSAccuracy,
    weeklyCompletionRate: Math.round((weekCompletedDays / 7) * 100),
  };
}

export function getRecentCompletedSession(sessions: StudySession[]): StudySession | undefined {
  return [...sessions]
    .filter((session) => session.isCompleted)
    .sort((left, right) => right.date.localeCompare(left.date))[0];
}

export function getTrendData(sessions: StudySession[]): TrendPoint[] {
  return getCompletedSessions(sessions).map((session) => ({
    date: session.date,
    label: session.date.slice(5),
    minutes: getEffectiveActualMinutes(session),
    blindComprehension: session.blindListening.comprehension,
    intensiveComprehension: session.intensiveListening.comprehension,
    workplaceSpeaking: session.workplaceSpeaking.duration,
    ieltsAccuracy: session.ieltsListening.accuracy,
    sentenceCount: session.sentences.filter((sentence) => sentence.text.trim()).length,
    ieltsSpeakingCount: session.ieltsSpeaking.recordingId || session.ieltsSpeaking.transcript.trim() ? 1 : 0,
  }));
}

export function getErrorReasonStats(sessions: StudySession[]): ErrorReasonStat[] {
  const counts = new Map<string, number>();
  getCompletedSessions(sessions).forEach((session) => {
    session.ieltsListening.errorReasons.forEach((reason) => {
      counts.set(reason, (counts.get(reason) ?? 0) + 1);
    });
  });

  return [...counts.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((left, right) => right.count - left.count);
}

export function getReviewQueue(data: AppData): ReviewQueueData {
  const sortedSentences = [...data.sentenceBank].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const weakSentences = sortedSentences.filter((sentence) => sentence.mastery === "weak");
  const recentSentences = sortedSentences.filter((sentence) => isWithinDays(sentence.createdAt, 7));
  const lastSpeakingImprovement = [...data.sessions]
    .filter((session) => session.isCompleted && session.ieltsSpeaking.improvement.trim())
    .sort((left, right) => right.date.localeCompare(left.date))[0]?.ieltsSpeaking.improvement;

  return {
    recentSentences: recentSentences.slice(0, 6),
    weakSentences: weakSentences.slice(0, 6),
    topErrorReasons: getErrorReasonStats(data.sessions).slice(0, 5),
    lastSpeakingImprovement,
  };
}

export function getSentenceBankByFilters(
  sentences: Sentence[],
  search: string,
  tag: string,
  mastery: string,
): Sentence[] {
  return sentences.filter((sentence) => {
    const matchSearch =
      !search ||
      sentence.text.toLowerCase().includes(search.toLowerCase()) ||
      sentence.translation.toLowerCase().includes(search.toLowerCase()) ||
      sentence.scenario.toLowerCase().includes(search.toLowerCase());
    const matchTag = !tag || sentence.tag === tag;
    const matchMastery = !mastery || sentence.mastery === mastery;
    return matchSearch && matchTag && matchMastery;
  });
}

export function getWeeklyReviewData(data: AppData): WeeklyReviewData {
  const weekStart = startOfWeek();
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weekSessions = getCompletedSessions(data.sessions).filter((session) => {
    const sessionTime = new Date(`${session.date}T12:00:00`).getTime();
    return sessionTime >= weekStart.getTime() && sessionTime <= weekEnd.getTime();
  });

  const completedDays = new Set(weekSessions.map((session) => session.date)).size;
  const totalMinutes = weekSessions.reduce((total, session) => total + getEffectiveActualMinutes(session), 0);
  const averageBlindComprehension =
    weekSessions.length === 0
      ? 0
      : Math.round(weekSessions.reduce((total, session) => total + session.blindListening.comprehension, 0) / weekSessions.length);
  const averageIntensiveComprehension =
    weekSessions.length === 0
      ? 0
      : Math.round(weekSessions.reduce((total, session) => total + session.intensiveListening.comprehension, 0) / weekSessions.length);
  const averageIELTSAccuracy =
    weekSessions.length === 0
      ? 0
      : Math.round(weekSessions.reduce((total, session) => total + session.ieltsListening.accuracy, 0) / weekSessions.length);

  const topSentences = data.sentenceBank
    .filter((sentence) => {
      const updatedAt = new Date(sentence.updatedAt).getTime();
      return updatedAt >= weekStart.getTime() && updatedAt <= weekEnd.getTime() + 24 * 60 * 60 * 1000;
    })
    .sort((left, right) => {
      const masteryWeight = (sentence: Sentence) => (sentence.mastery === "weak" ? 0 : sentence.mastery === "normal" ? 1 : 2);
      if (masteryWeight(left) !== masteryWeight(right)) {
        return masteryWeight(left) - masteryWeight(right);
      }
      return left.reviewCount - right.reviewCount;
    })
    .slice(0, 4);

  const topErrorReasons = getErrorReasonStats(weekSessions).slice(0, 4);
  const biggestGains = [...new Set(weekSessions.map((session) => session.review.biggestGain.trim()).filter(Boolean))].slice(0, 3);
  const biggestProblems = [...new Set(weekSessions.map((session) => session.review.biggestProblem.trim()).filter(Boolean))].slice(0, 3);
  const nextFocuses = [
    ...new Set(
      weekSessions
        .flatMap((session) => [
          session.review.tomorrowReview.trim(),
          session.ieltsListening.nextFocus.trim(),
          session.ieltsSpeaking.improvement.trim(),
        ])
        .filter(Boolean),
    ),
  ].slice(0, 5);

  return {
    weekStart: getLocalDateKey(weekStart),
    weekEnd: getLocalDateKey(weekEnd),
    completedDays,
    totalMinutes,
    completedSessions: weekSessions.length,
    averageBlindComprehension,
    averageIntensiveComprehension,
    averageIELTSAccuracy,
    topSentences,
    topErrorReasons,
    biggestGains,
    biggestProblems,
    nextFocuses,
  };
}
