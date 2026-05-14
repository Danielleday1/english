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
  syncCloudNow: () => Promise<void>;
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
  const isOnline = typeof navigator === "undefined" ? true : navigator.onLine;
  return {
    phase: configured ? "checking" : "setup_required",
    isConfigured: configured,
    isSignedIn: false,
    isLoggedIn: false,
    autoSyncEnabled: preferences.autoSyncEnabled,
    pendingChanges: preferences.pendingChanges ?? false,
    isSyncing: false,
    isOnline,
    hasRemoteSnapshot: false,
    restoreRecommended: false,
    lastSyncedAt: preferences.lastSyncedAt,
    localUpdatedAt: preferences.localUpdatedAt,
    lastSyncError: preferences.lastSyncError,
    displayStatus: configured ? (isOnline ? "signed_out" : "offline") : "local_only",
    message: configured ? "登录同一账号后，系统会自动恢复云端最新数据。" : "还没有配置云端同步，当前仍然只保存在本地。",
  };
}

function serializeAppData(data: AppData): string {
  return JSON.stringify(data);
}

function getLatestLocalUpdatedAt(data: AppData): string | undefined {
  const timestamps = [
    ...data.sessions.map((session) => session.updatedAt),
    ...data.sentenceBank.map((sentence) => sentence.updatedAt),
    ...data.recordings.map((recording) => recording.updatedAt ?? recording.syncedAt ?? recording.createdAt),
  ].filter(Boolean);

  const sorted = timestamps.sort();
  return sorted[sorted.length - 1];
}

function getDisplayStatus(state: {
  isConfigured: boolean;
  isSignedIn: boolean;
  isOnline: boolean;
  isSyncing: boolean;
  pendingChanges: boolean;
  lastSyncError?: string;
}): CloudSyncState["displayStatus"] {
  if (!state.isConfigured) {
    return "local_only";
  }
  if (!state.isOnline) {
    return "offline";
  }
  if (!state.isSignedIn) {
    return "signed_out";
  }
  if (state.isSyncing) {
    return "syncing";
  }
  if (state.lastSyncError) {
    return "failed";
  }
  if (state.pendingChanges) {
    return "pending";
  }
  return "synced";
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

function getTimestamp(value?: string): number {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function mergeSessions(localSessions: StudySession[], remoteSessions: StudySession[]): StudySession[] {
  const sessionsByDate = new Map<string, StudySession>();

  for (const session of [...localSessions, ...remoteSessions]) {
    const existing = sessionsByDate.get(session.date);
    if (!existing || getTimestamp(session.updatedAt) >= getTimestamp(existing.updatedAt)) {
      sessionsByDate.set(session.date, session);
    }
  }

  return sortSessions(Array.from(sessionsByDate.values()));
}

function mergeSentences(localSentences: Sentence[], remoteSentences: Sentence[], sessions: StudySession[]): Sentence[] {
  const sentenceMap = new Map<string, Sentence>();

  for (const sentence of [...localSentences, ...remoteSentences, ...sessions.flatMap((session) => session.sentences)]) {
    const existing = sentenceMap.get(sentence.id);
    if (!existing || getTimestamp(sentence.updatedAt) >= getTimestamp(existing.updatedAt)) {
      sentenceMap.set(sentence.id, sentence);
    }
  }

  return Array.from(sentenceMap.values());
}

function mergeRecordings(localRecordings: Recording[], remoteRecordings: Recording[]): Recording[] {
  const recordingMap = new Map<string, Recording>();

  for (const recording of [...localRecordings, ...remoteRecordings]) {
    const existing = recordingMap.get(recording.id);
    const currentTimestamp = Math.max(getTimestamp(recording.syncedAt), getTimestamp(recording.createdAt));
    const existingTimestamp = existing ? Math.max(getTimestamp(existing.syncedAt), getTimestamp(existing.createdAt)) : 0;

    if (!existing || currentTimestamp >= existingTimestamp) {
      recordingMap.set(recording.id, recording);
    }
  }

  return Array.from(recordingMap.values());
}

function mergeAppData(localData: AppData, remoteData: AppData): AppData {
  const sessions = mergeSessions(localData.sessions, remoteData.sessions);
  return {
    sessions,
    sentenceBank: mergeSentences(localData.sentenceBank, remoteData.sentenceBank, sessions),
    recordings: mergeRecordings(localData.recordings, remoteData.recordings),
    monthlyGoalDays: remoteData.monthlyGoalDays || localData.monthlyGoalDays,
  };
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
  const didInitializeSyncRef = useRef(false);
  const dataRef = useRef(data);
  const cloudSyncRef = useRef(cloudSync);
  const localSignatureRef = useRef(serializeAppData(data));

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    cloudSyncRef.current = cloudSync;
  }, [cloudSync]);

  useEffect(() => {
    saveAppData(data);
    const signature = serializeAppData(data);
    if (signature !== localSignatureRef.current) {
      localSignatureRef.current = signature;
      if (!skipAutoSyncRef.current && didInitializeSyncRef.current) {
        markPendingChanges(data);
      }
    }
  }, [data]);

  const todayKey = getLocalDateKey();
  const todaySession = data.sessions.find((session) => session.date === todayKey) ?? createEmptySession();

  function setCloudState(next: Partial<CloudSyncState> | ((current: CloudSyncState) => Partial<CloudSyncState>)) {
    setCloudSync((current) => {
      const patch = typeof next === "function" ? next(current) : next;
      const merged = {
        ...current,
        ...patch,
      };
      const withStatus = {
        ...merged,
        displayStatus: patch.displayStatus ?? getDisplayStatus(merged),
      };
      saveCloudSyncPreferences({
        autoSyncEnabled: withStatus.autoSyncEnabled,
        lastSyncedAt: withStatus.lastSyncedAt,
        pendingChanges: withStatus.pendingChanges,
        localUpdatedAt: withStatus.localUpdatedAt,
        lastSyncError: withStatus.lastSyncError,
      });
      cloudSyncRef.current = withStatus;
      return withStatus;
    });
  }

  function markPendingChanges(nextData: AppData) {
    const localUpdatedAt = getLatestLocalUpdatedAt(nextData) ?? new Date().toISOString();
    setCloudState({
      pendingChanges: true,
      localUpdatedAt,
      lastSyncError: undefined,
    });
  }

  async function refreshCloudSync(userOverride?: User | null) {
    if (!isCloudSyncConfigured()) {
      setCloudState({
        phase: "setup_required",
        isConfigured: false,
        isSignedIn: false,
        isLoggedIn: false,
        userEmail: undefined,
        accountEmail: undefined,
        userId: undefined,
        hasRemoteSnapshot: false,
        restoreRecommended: false,
        restoreReason: undefined,
        remoteUpdatedAt: undefined,
        cloudUpdatedAt: undefined,
        message: "还没有配置云端同步，当前仍然只保存在本地。",
      });
      return;
    }

    try {
      const user = userOverride ?? (await getCloudUser());
      if (!user) {
        setCloudState({
          phase: "signed_out",
          isConfigured: true,
          isSignedIn: false,
          isLoggedIn: false,
          userEmail: undefined,
          accountEmail: undefined,
          userId: undefined,
          hasRemoteSnapshot: false,
          restoreRecommended: false,
          restoreReason: undefined,
          remoteUpdatedAt: undefined,
          cloudUpdatedAt: undefined,
          message: "登录同一账号后，系统会自动恢复云端最新数据。",
        });
        return;
      }

      const meta = await fetchCloudSnapshotMeta();
      setCloudState((current) => ({
        phase: "ready",
        isConfigured: true,
        isSignedIn: true,
        isLoggedIn: true,
        userEmail: user.email,
        accountEmail: user.email,
        userId: user.id,
        hasRemoteSnapshot: meta.hasSnapshot,
        remoteUpdatedAt: meta.remoteUpdatedAt,
        cloudUpdatedAt: meta.remoteUpdatedAt,
        restoreRecommended: false,
        restoreReason: undefined,
        message: current.pendingChanges ? "有未同步内容，系统会自动尝试同步。" : "已连接云端。练习记录会自动同步。",
      }));
    } catch (error) {
      setCloudState({
        phase: "error",
        lastSyncError: getCloudSyncErrorMessage(error),
        message: getCloudSyncErrorMessage(error),
      });
    }
  }

  async function runPushCloudBackup(mode: "manual" | "automatic"): Promise<void> {
    if (!navigator.onLine) {
      setCloudState({
        pendingChanges: true,
        lastSyncError: "当前离线，练习记录已保存在本机。",
        message: "当前离线，练习记录已保存在本机。",
      });
      return;
    }

    setCloudState({
      phase: "syncing",
      isSyncing: true,
      lastSyncError: undefined,
      message: mode === "automatic" ? "正在自动同步到云端..." : "正在上传当前学习记录和录音到云端...",
    });

    try {
      const sourceData = dataRef.current;
      const result = await pushDataToCloud(sourceData);
      const signature = serializeAppData(sourceData);
      lastSyncedSignatureRef.current = signature;

      setCloudState({
        phase: "ready",
        isSyncing: false,
        autoSyncEnabled: true,
        hasRemoteSnapshot: true,
        restoreRecommended: false,
        restoreReason: undefined,
        pendingChanges: false,
        lastSyncedAt: result.syncedAt,
        localUpdatedAt: getLatestLocalUpdatedAt(sourceData) ?? result.syncedAt,
        remoteUpdatedAt: result.remoteUpdatedAt,
        cloudUpdatedAt: result.remoteUpdatedAt,
        lastSyncError: undefined,
        message: mode === "automatic" ? "已自动同步到云端。" : "已自动同步到云端。",
      });
    } catch (error) {
      setCloudState({
        phase: "error",
        isSyncing: false,
        pendingChanges: true,
        lastSyncError: getCloudSyncErrorMessage(error),
        message: "本地已保存，云端同步失败。联网后会自动重试。",
      });
      throw error;
    }
  }

  async function runSmartCloudSync(reason: "startup" | "manual" | "auto" | "complete" | "resume" | "online" = "auto"): Promise<void> {
    if (!isCloudSyncConfigured()) {
      return;
    }

    if (!navigator.onLine) {
      setCloudState({
        isOnline: false,
        pendingChanges: cloudSyncRef.current.pendingChanges,
        lastSyncError: "当前离线，练习记录已保存在本机。",
        message: "当前离线，练习记录已保存在本机。",
      });
      return;
    }

    const user = await getCloudUser();
    if (!user) {
      await refreshCloudSync(null);
      return;
    }

    setCloudState({
      phase: "syncing",
      isConfigured: true,
      isSignedIn: true,
      isLoggedIn: true,
      userEmail: user.email,
      accountEmail: user.email,
      userId: user.id,
      isOnline: true,
      isSyncing: true,
      lastSyncError: undefined,
      message: reason === "manual" ? "正在判断本机和云端数据..." : "正在自动检查云端数据...",
    });

    try {
      const meta = await fetchCloudSnapshotMeta();
      let workingData = dataRef.current;
      const localHasData = hasPersistedLearningData(workingData);
      const cloudIsNewer = meta.hasSnapshot && isLaterTimestamp(meta.remoteUpdatedAt, cloudSyncRef.current.lastSyncedAt);
      let pulledRemote = false;

      if (meta.hasSnapshot && (!localHasData || cloudIsNewer)) {
        const remote = await pullDataFromCloud({ clearExistingAudio: !localHasData });
        workingData = localHasData && cloudSyncRef.current.pendingChanges ? mergeAppData(workingData, remote.data) : mergeAppData(workingData, remote.data);
        skipAutoSyncRef.current = true;
        setData(ensureTodaySession(workingData));
        dataRef.current = ensureTodaySession(workingData);
        pulledRemote = true;
      }

      const shouldSeedCloud = !meta.hasSnapshot && hasPersistedLearningData(workingData);
      const shouldPush = cloudSyncRef.current.pendingChanges || shouldSeedCloud || (pulledRemote && hasPersistedLearningData(workingData));
      let syncedAt = new Date().toISOString();
      let remoteUpdatedAt = meta.remoteUpdatedAt;

      if (shouldPush) {
        const result = await pushDataToCloud(dataRef.current);
        syncedAt = result.syncedAt;
        remoteUpdatedAt = result.remoteUpdatedAt;
      } else if (pulledRemote) {
        syncedAt = meta.remoteUpdatedAt ?? syncedAt;
      }

      lastSyncedSignatureRef.current = serializeAppData(dataRef.current);
      setCloudState({
        phase: "ready",
        isSyncing: false,
        autoSyncEnabled: true,
        hasRemoteSnapshot: meta.hasSnapshot || shouldPush,
        restoreRecommended: false,
        restoreReason: undefined,
        pendingChanges: false,
        lastSyncedAt: syncedAt,
        localUpdatedAt: getLatestLocalUpdatedAt(dataRef.current) ?? syncedAt,
        remoteUpdatedAt,
        cloudUpdatedAt: remoteUpdatedAt,
        lastSyncError: undefined,
        message: pulledRemote || shouldPush ? "已自动同步到云端。" : "已同步。",
      });
      window.setTimeout(() => {
        skipAutoSyncRef.current = false;
      }, 0);
    } catch (error) {
      skipAutoSyncRef.current = false;
      setCloudState({
        phase: "error",
        isSyncing: false,
        pendingChanges: true,
        lastSyncError: getCloudSyncErrorMessage(error),
        message: "本地已保存，云端同步失败。联网后会自动重试。",
      });
      if (reason === "manual" || reason === "complete") {
        throw error;
      }
    }
  }

  useEffect(() => {
    didInitializeSyncRef.current = true;
    void runSmartCloudSync("startup");
    const unsubscribe = subscribeToCloudAuth((user) => {
      if (user) {
        void runSmartCloudSync("startup");
      } else {
        void refreshCloudSync(user);
      }
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

    if (!cloudSync.isConfigured || !cloudSync.isSignedIn || !cloudSync.autoSyncEnabled || !cloudSync.pendingChanges) {
      return;
    }

    if (cloudSync.phase === "syncing" || skipAutoSyncRef.current) {
      return;
    }

    if (!hasPersistedLearningData(data)) {
      return;
    }

    const signature = serializeAppData(data);
    if (signature === lastSyncedSignatureRef.current) {
      return;
    }

    autoSyncTimerRef.current = window.setTimeout(() => {
      void runSmartCloudSync("auto");
    }, 3500);

    return () => {
      if (autoSyncTimerRef.current) {
        window.clearTimeout(autoSyncTimerRef.current);
      }
    };
  }, [cloudSync.autoSyncEnabled, cloudSync.isConfigured, cloudSync.isSignedIn, cloudSync.pendingChanges, cloudSync.phase, data]);

  useEffect(() => {
    const handleOnline = () => {
      setCloudState({ isOnline: true, lastSyncError: undefined });
      void runSmartCloudSync("online");
    };
    const handleOffline = () => {
      setCloudState({
        isOnline: false,
        message: "当前离线，练习记录已保存在本机。",
      });
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void runSmartCloudSync("resume");
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  function setTodaySession(nextSession: StudySession) {
    const wasCompleted = dataRef.current.sessions.find((session) => session.id === nextSession.id)?.isCompleted ?? false;
    const shouldSyncImmediately = nextSession.isCompleted && !wasCompleted;
    const now = new Date().toISOString();

    setData((current) => {
      const nextData = {
        ...current,
        sessions: sortSessions(
          current.sessions.map((session) => (session.id === nextSession.id ? { ...nextSession, updatedAt: now } : session)),
        ),
      };
      dataRef.current = nextData;
      return nextData;
    });

    if (shouldSyncImmediately) {
      setCloudState({
        pendingChanges: true,
        localUpdatedAt: now,
        lastSyncError: undefined,
      });
      window.setTimeout(() => {
        void runSmartCloudSync("complete");
      }, 0);
    }
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
    setCloudState({
      phase: "syncing",
      isSyncing: true,
      lastSyncError: undefined,
      message: "正在从云端恢复数据到这台电脑...",
    });

    try {
      const result = await pullDataFromCloud();
      const nextData = ensureTodaySession(result.data);
      skipAutoSyncRef.current = true;
      lastSyncedSignatureRef.current = serializeAppData(nextData);
      dataRef.current = nextData;
      setData(nextData);
      setCloudState({
        phase: "ready",
        isSyncing: false,
        autoSyncEnabled: true,
        hasRemoteSnapshot: true,
        restoreRecommended: false,
        restoreReason: undefined,
        pendingChanges: false,
        lastSyncedAt: result.syncedAt,
        remoteUpdatedAt: result.remoteUpdatedAt,
        cloudUpdatedAt: result.remoteUpdatedAt,
        localUpdatedAt: getLatestLocalUpdatedAt(nextData) ?? result.syncedAt,
        lastSyncError: undefined,
        message: "已从云端恢复到这台电脑。",
      });
      window.setTimeout(() => {
        skipAutoSyncRef.current = false;
      }, 0);
    } catch (error) {
      skipAutoSyncRef.current = false;
      setCloudState({
        phase: "error",
        isSyncing: false,
        lastSyncError: getCloudSyncErrorMessage(error),
        message: getCloudSyncErrorMessage(error),
      });
      throw error;
    }
  }

  async function signOutCloudUser(): Promise<void> {
    try {
      await signOutCloud();
      setCloudState({
        phase: "signed_out",
        isSignedIn: false,
        isLoggedIn: false,
        autoSyncEnabled: true,
        pendingChanges: cloudSyncRef.current.pendingChanges,
        isSyncing: false,
        userEmail: undefined,
        accountEmail: undefined,
        userId: undefined,
        hasRemoteSnapshot: false,
        restoreRecommended: false,
        restoreReason: undefined,
        remoteUpdatedAt: undefined,
        cloudUpdatedAt: undefined,
        lastSyncError: undefined,
        message: "已从当前浏览器退出云端同步。本地记录仍然保留。",
      });
    } catch (error) {
      setCloudState({
        phase: "error",
        lastSyncError: getCloudSyncErrorMessage(error),
        message: getCloudSyncErrorMessage(error),
      });
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
        syncCloudNow: async () => {
          await runSmartCloudSync("manual");
        },
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
