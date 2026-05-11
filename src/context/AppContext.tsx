import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  fetchCloudSnapshotMeta,
  getCloudUser,
  isCloudSyncConfigured,
  pullDataFromCloud,
  pushDataToCloud,
  requestMagicLink,
  signOutCloud,
  subscribeToCloudAuth,
} from "../storage/cloudSync";
import { loadAppData, loadCloudSyncPreferences, saveAppData, saveCloudSyncPreferences } from "../storage/localStorage";
import type { AppData, BackupPayload, CloudSyncState, Recording, Sentence, StudySession } from "../types/study";
import { clearAudioStore, deleteAudioBlob, saveAudioBlob } from "../storage/indexedDb";
import { createEmptySession, createId, hasMeaningfulSessionContent } from "../utils/study";
import { getLocalDateKey } from "../utils/date";

interface AppContextValue {
  data: AppData;
  todaySession: StudySession;
  cloudSync: CloudSyncState;
  setTodaySession: (nextSession: StudySession) => void;
  completeTodaySession: () => void;
  syncSessionSentences: (sessionId: string, sentences: Sentence[]) => void;
  reviewSentence: (sentenceId: string) => void;
  updateSentence: (sentence: Sentence) => void;
  deleteSentence: (sentenceId: string) => void;
  saveRecording: (payload: Omit<Recording, "id" | "blobKey" | "createdAt">, blob: Blob) => Promise<Recording>;
  deleteRecording: (recordingId: string) => Promise<void>;
  replaceAllData: (payload: BackupPayload) => Promise<void>;
  requestCloudMagicLink: (email: string) => Promise<void>;
  pushCloudBackup: () => Promise<void>;
  pullCloudBackup: () => Promise<void>;
  signOutCloudUser: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function ensureTodaySession(data: AppData): AppData {
  const todayKey = getLocalDateKey();
  const hasToday = data.sessions.some((session) => session.date === todayKey);
  if (hasToday) {
    return data;
  }

  return {
    ...data,
    sessions: [...data.sessions, createEmptySession()],
  };
}

function sortSessions(sessions: StudySession[]): StudySession[] {
  return [...sessions].sort((left, right) => left.date.localeCompare(right.date));
}

function syncSessionSentenceReferences(sessions: StudySession[], sentence: Sentence): StudySession[] {
  return sessions.map((session) => ({
    ...session,
    sentences: session.sentences.map((item) => (item.id === sentence.id ? sentence : item)),
  }));
}

function createInitialCloudSyncState(): CloudSyncState {
  const preferences = loadCloudSyncPreferences();
  const configured = isCloudSyncConfigured();
  return {
    phase: configured ? "checking" : "setup_required",
    isConfigured: configured,
    isSignedIn: false,
    autoSyncEnabled: preferences.autoSyncEnabled,
    hasRemoteSnapshot: false,
    restoreRecommended: false,
    lastSyncedAt: preferences.lastSyncedAt,
    message: configured ? "登录同一个邮箱后，就可以把记录同步到别的电脑。" : "还没有配置云端同步，当前仍然只保存在本地。",
  };
}

function serializeAppData(data: AppData): string {
  return JSON.stringify(data);
}

function hasPersistedLearningData(data: AppData): boolean {
  return data.sessions.some((session) => hasMeaningfulSessionContent(session) || session.isCompleted) || data.sentenceBank.length > 0 || data.recordings.length > 0;
}

function isLaterTimestamp(left?: string, right?: string): boolean {
  if (!left) {
    return false;
  }

  if (!right) {
    return true;
  }

  return new Date(left).getTime() > new Date(right).getTime();
}

function getCloudSyncErrorMessage(error: unknown): string {
  const fallback = "云端操作失败，请稍后再试。";
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.trim();
  const lower = message.toLowerCase();

  if (lower.includes("email rate limit exceeded")) {
    return "登录邮件发送太频繁了，Supabase 暂时限流。先等至少 60 秒再试；如果今天已经连续发过几次，内置邮箱服务可能需要等约 1 小时恢复。";
  }

  if (lower.includes("security purposes") || lower.includes("can only request this after")) {
    return "这次发送得太快了。为安全起见，请等 60 秒后再重新发送登录链接。";
  }

  if (lower.includes("email link is invalid or has expired")) {
    return "这封登录邮件已经失效了，请回到页面重新发送一封新的登录链接。";
  }

  return message || fallback;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => ensureTodaySession(loadAppData()));
  const [cloudSync, setCloudSync] = useState<CloudSyncState>(createInitialCloudSyncState);
  const autoSyncTimerRef = useRef<number | null>(null);
  const lastSyncedSignatureRef = useRef("");
  const skipAutoSyncRef = useRef(false);
  const autoRestoreAttemptedRef = useRef(false);

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  const todayKey = getLocalDateKey();
  const todaySession = data.sessions.find((session) => session.date === todayKey) ?? createEmptySession();

  function persistCloudPreferences(autoSyncEnabled: boolean, lastSyncedAt?: string) {
    saveCloudSyncPreferences({
      autoSyncEnabled,
      lastSyncedAt,
    });
  }

  async function refreshCloudSync(userOverride?: User | null) {
    if (!isCloudSyncConfigured()) {
      setCloudSync((current) => ({
        ...current,
        phase: "setup_required",
        isConfigured: false,
        isSignedIn: false,
        userEmail: undefined,
        userId: undefined,
        hasRemoteSnapshot: false,
        restoreRecommended: false,
        restoreReason: undefined,
        remoteUpdatedAt: undefined,
        message: "还没有配置云端同步，当前仍然只保存在本地。",
      }));
      return;
    }

    try {
      const user = userOverride ?? (await getCloudUser());
      if (!user) {
        setCloudSync((current) => ({
          ...current,
          phase: "signed_out",
          isConfigured: true,
          isSignedIn: false,
          userEmail: undefined,
          userId: undefined,
          hasRemoteSnapshot: false,
          restoreRecommended: false,
          restoreReason: undefined,
          remoteUpdatedAt: undefined,
          message: "登录同一个邮箱后，就能在别的电脑恢复这份学习记录。",
        }));
        return;
      }

      const meta = await fetchCloudSnapshotMeta();
      const localHasData = hasPersistedLearningData(data);
      setCloudSync((current) => ({
        ...current,
        phase: "ready",
        isConfigured: true,
        isSignedIn: true,
        userEmail: user.email,
        userId: user.id,
        hasRemoteSnapshot: meta.hasSnapshot,
        restoreRecommended: meta.hasSnapshot && (!localHasData || isLaterTimestamp(meta.remoteUpdatedAt, current.lastSyncedAt)),
        restoreReason: meta.hasSnapshot
          ? !localHasData
            ? "这台电脑本地还是空的，登录后会优先从云端接续你的历史记录。"
            : isLaterTimestamp(meta.remoteUpdatedAt, current.lastSyncedAt)
              ? "检测到云端记录比这台电脑上次同步更新，如果这是另一台设备，建议先恢复云端数据。"
              : undefined
          : undefined,
        remoteUpdatedAt: meta.remoteUpdatedAt,
        message: meta.hasSnapshot
          ? !localHasData
            ? "检测到云端已有记录，这台电脑会自动恢复一次，然后你就可以直接开始学习。"
            : isLaterTimestamp(meta.remoteUpdatedAt, current.lastSyncedAt)
              ? "云端已经连上了。检测到云端可能比本地更新，如果这是另一台电脑，建议先恢复一次。"
              : "云端已经连上了。之后直接继续学习，新的改动会自动同步。"
          : "云端已经连上了。先上传一次当前数据，别的电脑就能继续使用。",
      }));
    } catch (error) {
      setCloudSync((current) => ({
        ...current,
        phase: "error",
        message: getCloudSyncErrorMessage(error),
      }));
    }
  }

  async function runPushCloudBackup(mode: "manual" | "automatic"): Promise<void> {
    setCloudSync((current) => ({
      ...current,
      phase: "syncing",
      message: mode === "automatic" ? "正在把刚才的改动同步到云端..." : "正在上传当前学习记录和录音到云端...",
    }));

    try {
      const result = await pushDataToCloud(data);
      const signature = serializeAppData(data);
      lastSyncedSignatureRef.current = signature;
      persistCloudPreferences(true, result.syncedAt);

      setCloudSync((current) => ({
        ...current,
        phase: "ready",
        autoSyncEnabled: true,
        hasRemoteSnapshot: true,
        restoreRecommended: false,
        restoreReason: undefined,
        lastSyncedAt: result.syncedAt,
        remoteUpdatedAt: result.remoteUpdatedAt,
        message: mode === "automatic" ? "最新改动已经自动同步到云端。" : "当前数据和录音已经上传到云端。",
      }));
    } catch (error) {
      setCloudSync((current) => ({
        ...current,
        phase: "error",
        message: getCloudSyncErrorMessage(error),
      }));
      throw error;
    }
  }

  useEffect(() => {
    void refreshCloudSync();
    const unsubscribe = subscribeToCloudAuth((user) => {
      autoRestoreAttemptedRef.current = false;
      void refreshCloudSync(user);
    });

    return () => {
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    const todayMissing = !data.sessions.some((session) => session.date === todayKey);
    if (todayMissing) {
      setData((current) => ensureTodaySession(current));
    }
  }, [data.sessions, todayKey]);

  useEffect(() => {
    if (autoSyncTimerRef.current) {
      window.clearTimeout(autoSyncTimerRef.current);
      autoSyncTimerRef.current = null;
    }

    if (!cloudSync.isConfigured || !cloudSync.isSignedIn || !cloudSync.autoSyncEnabled) {
      return;
    }

    if (cloudSync.phase === "syncing" || skipAutoSyncRef.current) {
      return;
    }

    if (!hasPersistedLearningData(data) && cloudSync.hasRemoteSnapshot) {
      return;
    }

    const signature = serializeAppData(data);
    if (signature === lastSyncedSignatureRef.current) {
      return;
    }

    autoSyncTimerRef.current = window.setTimeout(() => {
      void runPushCloudBackup("automatic");
    }, 1500);

    return () => {
      if (autoSyncTimerRef.current) {
        window.clearTimeout(autoSyncTimerRef.current);
      }
    };
  }, [cloudSync.autoSyncEnabled, cloudSync.hasRemoteSnapshot, cloudSync.isConfigured, cloudSync.isSignedIn, cloudSync.phase, data]);

  useEffect(() => {
    if (!cloudSync.isConfigured || !cloudSync.isSignedIn || !cloudSync.hasRemoteSnapshot) {
      return;
    }

    if (cloudSync.phase !== "ready" || autoRestoreAttemptedRef.current) {
      return;
    }

    if (hasPersistedLearningData(data)) {
      return;
    }

    autoRestoreAttemptedRef.current = true;
    void pullCloudBackup();
  }, [cloudSync.hasRemoteSnapshot, cloudSync.isConfigured, cloudSync.isSignedIn, cloudSync.phase, data]);

  function setTodaySession(nextSession: StudySession) {
    setData((current) => ({
      ...current,
      sessions: sortSessions(
        current.sessions.map((session) => (session.id === nextSession.id ? { ...nextSession, updatedAt: new Date().toISOString() } : session)),
      ),
    }));
  }

  function completeTodaySession() {
    setTodaySession({
      ...todaySession,
      isCompleted: true,
      updatedAt: new Date().toISOString(),
    });
  }

  function syncSessionSentences(sessionId: string, sentences: Sentence[]) {
    setData((current) => {
      const now = new Date().toISOString();
      const sentenceIds = new Set(sentences.map((sentence) => sentence.id));
      const nextSessions = current.sessions.map((session) => {
        if (session.id !== sessionId) {
          return session;
        }

        return {
          ...session,
          sentences,
          shadowing: session.shadowing.filter((record) => sentenceIds.has(record.sentenceId)),
          updatedAt: now,
        };
      });

      const bankWithoutSession = current.sentenceBank.filter((sentence) => sentence.sessionId !== sessionId);

      return {
        ...current,
        sessions: nextSessions,
        sentenceBank: [...bankWithoutSession, ...sentences.filter((sentence) => sentence.text.trim())],
      };
    });
  }

  function reviewSentence(sentenceId: string) {
    setData((current) => {
      const now = new Date().toISOString();
      const nextBank = current.sentenceBank.map((sentence) =>
        sentence.id === sentenceId
          ? {
              ...sentence,
              reviewCount: sentence.reviewCount + 1,
              lastReviewedAt: now,
              updatedAt: now,
            }
          : sentence,
      );

      const updatedSentence = nextBank.find((sentence) => sentence.id === sentenceId);
      return {
        ...current,
        sentenceBank: nextBank,
        sessions: updatedSentence ? syncSessionSentenceReferences(current.sessions, updatedSentence) : current.sessions,
      };
    });
  }

  function updateSentence(sentence: Sentence) {
    setData((current) => {
      const now = new Date().toISOString();
      const nextSentence = { ...sentence, updatedAt: now };
      return {
        ...current,
        sentenceBank: current.sentenceBank.map((item) => (item.id === sentence.id ? nextSentence : item)),
        sessions: syncSessionSentenceReferences(current.sessions, nextSentence),
      };
    });
  }

  function deleteSentence(sentenceId: string) {
    setData((current) => ({
      ...current,
      sentenceBank: current.sentenceBank.filter((sentence) => sentence.id !== sentenceId),
      sessions: current.sessions.map((session) => ({
        ...session,
        sentences: session.sentences.filter((sentence) => sentence.id !== sentenceId),
        shadowing: session.shadowing.filter((record) => record.sentenceId !== sentenceId),
      })),
    }));
  }

  async function saveRecording(payload: Omit<Recording, "id" | "blobKey" | "createdAt">, blob: Blob): Promise<Recording> {
    const recording: Recording = {
      ...payload,
      id: createId("recording"),
      blobKey: createId("blob"),
      createdAt: new Date().toISOString(),
    };

    await saveAudioBlob(recording.blobKey, blob);
    setData((current) => ({
      ...current,
      recordings: [...current.recordings, recording],
    }));
    return recording;
  }

  async function deleteRecording(recordingId: string): Promise<void> {
    const recording = data.recordings.find((item) => item.id === recordingId);
    if (!recording) {
      return;
    }

    await deleteAudioBlob(recording.blobKey);
    setData((current) => ({
      ...current,
      recordings: current.recordings.filter((item) => item.id !== recordingId),
      sessions: current.sessions.map((session) => ({
        ...session,
        workplaceSpeaking:
          session.workplaceSpeaking.recordingId === recordingId
            ? { ...session.workplaceSpeaking, recordingId: undefined, duration: 0 }
            : session.workplaceSpeaking,
        ieltsSpeaking:
          session.ieltsSpeaking.recordingId === recordingId
            ? { ...session.ieltsSpeaking, recordingId: undefined, duration: 0 }
            : session.ieltsSpeaking,
      })),
    }));
  }

  async function replaceAllData(payload: BackupPayload): Promise<void> {
    await clearAudioStore();

    if (payload.backupType === "full") {
      for (const audio of payload.data.audioBlobs) {
        const response = await fetch(audio.base64);
        const blob = await response.blob();
        await saveAudioBlob(audio.blobKey, blob);
      }
    }

    const nextData = ensureTodaySession({
      sessions: payload.data.sessions,
      sentenceBank: payload.data.sentences,
      recordings: payload.data.recordings,
      monthlyGoalDays: payload.data.monthlyGoalDays ?? 30,
    });

    setData(nextData);
  }

  async function requestCloudMagicLinkForEmail(email: string): Promise<void> {
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setCloudSync((current) => ({
        ...current,
        phase: "error",
        message: "先输入你的邮箱，再发送登录链接。",
      }));
      return;
    }

    setCloudSync((current) => ({
      ...current,
      phase: "checking",
      message: "登录链接正在发送，请去邮箱里打开它。",
    }));

    try {
      await requestMagicLink(normalizedEmail);
      setCloudSync((current) => ({
        ...current,
        phase: "signed_out",
        message: "登录链接已经发出。去邮箱点开后，这台电脑就会连上云端。",
      }));
    } catch (error) {
      setCloudSync((current) => ({
        ...current,
        phase: "error",
        message: getCloudSyncErrorMessage(error),
      }));
      throw error;
    }
  }

  async function pullCloudBackup(): Promise<void> {
    setCloudSync((current) => ({
      ...current,
      phase: "syncing",
      message: "正在从云端恢复数据到这台电脑...",
    }));

    try {
      const result = await pullDataFromCloud();
      const nextData = ensureTodaySession(result.data);
      skipAutoSyncRef.current = true;
      lastSyncedSignatureRef.current = serializeAppData(nextData);
      persistCloudPreferences(true, result.syncedAt);
      setData(nextData);
      setCloudSync((current) => ({
        ...current,
        phase: "ready",
        autoSyncEnabled: true,
        hasRemoteSnapshot: true,
        restoreRecommended: false,
        restoreReason: undefined,
        lastSyncedAt: result.syncedAt,
        remoteUpdatedAt: result.remoteUpdatedAt,
        message: "云端数据已经恢复到当前浏览器，你现在可以继续学习了。",
      }));
      window.setTimeout(() => {
        skipAutoSyncRef.current = false;
      }, 0);
    } catch (error) {
      skipAutoSyncRef.current = false;
      setCloudSync((current) => ({
        ...current,
        phase: "error",
        message: getCloudSyncErrorMessage(error),
      }));
      throw error;
    }
  }

  async function signOutCloudUser(): Promise<void> {
    try {
      await signOutCloud();
      persistCloudPreferences(false, cloudSync.lastSyncedAt);
      setCloudSync((current) => ({
        ...current,
        phase: "signed_out",
        isSignedIn: false,
        autoSyncEnabled: false,
        userEmail: undefined,
        userId: undefined,
        hasRemoteSnapshot: false,
        restoreRecommended: false,
        restoreReason: undefined,
        remoteUpdatedAt: undefined,
        message: "已从当前浏览器退出云端同步。本地记录仍然保留。",
      }));
    } catch (error) {
      setCloudSync((current) => ({
        ...current,
        phase: "error",
        message: getCloudSyncErrorMessage(error),
      }));
      throw error;
    }
  }

  return (
    <AppContext.Provider
      value={{
        data,
        todaySession,
        cloudSync,
        setTodaySession,
        completeTodaySession,
        syncSessionSentences,
        reviewSentence,
        updateSentence,
        deleteSentence,
        saveRecording,
        deleteRecording,
        replaceAllData,
        requestCloudMagicLink: requestCloudMagicLinkForEmail,
        pushCloudBackup: async () => {
          await runPushCloudBackup("manual");
        },
        pullCloudBackup,
        signOutCloudUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
}
