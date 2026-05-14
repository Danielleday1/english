export type MaterialType = "podcast" | "youtube" | "ielts_listening" | "other";
export type TopicType = "ai" | "product" | "business_meeting" | "web3" | "ielts" | "free";
export type DifficultyType = "easy" | "medium" | "hard";
export type MoodType = "relaxed" | "normal" | "tired" | "motivated" | "accomplished";
export type SentenceTag = "opinion" | "suggestion" | "problem" | "meeting" | "product" | "ai" | "web3" | "ielts";
export type MasteryType = "weak" | "normal" | "strong";
export type RecordingType = "workplace" | "ielts";
export type IELTSQuestionType = "completion" | "choice" | "matching" | "map" | "multiple_choice" | "mixed";
export type LinkStatus = "valid" | "invalid" | "empty";
export type PracticeMode = "workplace" | "ielts" | "mixed";
export type IELTSPracticeType = "listening" | "speaking" | "both" | "none";

export interface Material {
  id: string;
  title: string;
  url: string;
  type: MaterialType;
  topic: TopicType;
  difficulty: DifficultyType;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface Sentence {
  id: string;
  sessionId: string;
  text: string;
  translation: string;
  scenario: string;
  tag: SentenceTag;
  mastery: MasteryType;
  reviewCount: number;
  lastReviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface Recording {
  id: string;
  sessionId: string;
  type: RecordingType;
  duration: number;
  blobKey: string;
  mimeType: string;
  cloudPath?: string;
  syncedAt?: string;
  createdAt: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface WarmupRecord {
  mood: Exclude<MoodType, "accomplished">;
  completed: boolean;
}

export interface BlindListeningRecord {
  keywords: string[];
  comprehension: number;
  notes?: string;
}

export interface VocabularyItem {
  text: string;
  meaning: string;
  example: string;
}

export interface IntensiveListeningRecord {
  mainIdea: string;
  speakerPoint: string;
  unclearParts: string;
  comprehension: number;
  vocabulary: VocabularyItem[];
}

export interface ShadowingRecord {
  sentenceId: string;
  repeatCount: number;
  mastery: MasteryType;
}

export interface WorkplaceSpeakingRecord {
  prompt: string;
  transcript: string;
  recordingId?: string;
  duration: number;
  fluencyScore: number;
  clarityScore: number;
  confidenceScore: number;
}

export interface IELTSListeningRecord {
  materialName: string;
  section: 1 | 2 | 3 | 4;
  questionType: IELTSQuestionType;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  errorReasons: string[];
  notes: string;
  nextFocus: string;
}

export interface IELTSSpeakingScores {
  fluencyCoherence: number;
  lexicalResource: number;
  grammarRangeAccuracy: number;
  pronunciation: number;
}

export interface IELTSSpeakingRecord {
  part: 1 | 2 | 3;
  prompt: string;
  transcript: string;
  recordingId?: string;
  duration: number;
  scores: IELTSSpeakingScores;
  problems: string;
  improvement: string;
}

export interface DailyReview {
  biggestGain: string;
  biggestProblem: string;
  tomorrowReview: string;
  mood: MoodType;
}

export interface StudySession {
  id: string;
  date: string;
  practiceMode: PracticeMode;
  ieltsPracticeType: IELTSPracticeType;
  material: Material;
  warmup: WarmupRecord;
  blindListening: BlindListeningRecord;
  intensiveListening: IntensiveListeningRecord;
  sentences: Sentence[];
  shadowing: ShadowingRecord[];
  workplaceSpeaking: WorkplaceSpeakingRecord;
  ieltsListening: IELTSListeningRecord;
  ieltsSpeaking: IELTSSpeakingRecord;
  review: DailyReview;
  plannedMinutes: number;
  actualMinutes: number;
  completedSteps: string[];
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface DashboardStats {
  streakDays: number;
  monthlyMinutes: number;
  totalSpeakingMinutes: number;
  sentenceCount: number;
  averageIELTSAccuracy: number;
  weeklyCompletionRate: number;
}

export interface TrendPoint {
  date: string;
  label: string;
  minutes: number;
  blindComprehension: number;
  intensiveComprehension: number;
  workplaceSpeaking: number;
  ieltsAccuracy: number;
  sentenceCount: number;
  ieltsSpeakingCount: number;
}

export interface ErrorReasonStat {
  reason: string;
  count: number;
}

export interface ReviewQueueData {
  recentSentences: Sentence[];
  weakSentences: Sentence[];
  topErrorReasons: ErrorReasonStat[];
  lastSpeakingImprovement?: string;
}

export interface WeeklyReviewData {
  weekStart: string;
  weekEnd: string;
  completedDays: number;
  totalMinutes: number;
  completedSessions: number;
  averageBlindComprehension: number;
  averageIntensiveComprehension: number;
  averageIELTSAccuracy: number;
  topSentences: Sentence[];
  topErrorReasons: ErrorReasonStat[];
  biggestGains: string[];
  biggestProblems: string[];
  nextFocuses: string[];
}

export interface AppData {
  sessions: StudySession[];
  sentenceBank: Sentence[];
  recordings: Recording[];
  monthlyGoalDays: number;
}

export type CloudSyncPhase = "setup_required" | "signed_out" | "checking" | "ready" | "syncing" | "error";
export type CloudSyncDisplayStatus = "synced" | "syncing" | "pending" | "failed" | "offline" | "signed_out" | "local_only";

export interface CloudSyncState {
  phase: CloudSyncPhase;
  isConfigured: boolean;
  isSignedIn: boolean;
  isLoggedIn: boolean;
  autoSyncEnabled: boolean;
  pendingChanges: boolean;
  isSyncing: boolean;
  isOnline: boolean;
  userEmail?: string;
  accountEmail?: string;
  userId?: string;
  lastSyncedAt?: string;
  localUpdatedAt?: string;
  cloudUpdatedAt?: string;
  remoteUpdatedAt?: string;
  lastSyncError?: string;
  displayStatus: CloudSyncDisplayStatus;
  hasRemoteSnapshot: boolean;
  restoreRecommended: boolean;
  restoreReason?: string;
  message?: string;
}

export interface CloudSyncPreferences {
  autoSyncEnabled: boolean;
  lastSyncedAt?: string;
  pendingChanges?: boolean;
  localUpdatedAt?: string;
  lastSyncError?: string;
}

export interface TextBackupPayload {
  version: number;
  backupType: "text";
  exportedAt: string;
  data: {
    sessions: StudySession[];
    materials: Material[];
    sentences: Sentence[];
    monthlyGoalDays: number;
    statistics: {
      dashboard: DashboardStats;
      errorReasons: ErrorReasonStat[];
    };
    recordings: Recording[];
  };
}

export interface FullBackupPayload {
  version: number;
  backupType: "full";
  exportedAt: string;
  data: TextBackupPayload["data"] & {
    audioBlobs: Array<{
      blobKey: string;
      mimeType: string;
      base64: string;
    }>;
  };
}

export type BackupPayload = TextBackupPayload | FullBackupPayload;

export interface CloudSnapshotPayload {
  version: number;
  exportedAt: string;
  updatedAt: string;
  data: {
    sessions: StudySession[];
    sentences: Sentence[];
    recordings: Recording[];
    monthlyGoalDays: number;
  };
}
