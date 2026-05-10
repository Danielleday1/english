import { createContext, useContext, useEffect, useState } from "react";
import { loadAppData, saveAppData } from "../storage/localStorage";
import type { AppData, BackupPayload, Recording, Sentence, StudySession } from "../types/study";
import { clearAudioStore, deleteAudioBlob, saveAudioBlob } from "../storage/indexedDb";
import { createEmptySession, createId } from "../utils/study";
import { getLocalDateKey } from "../utils/date";

interface AppContextValue {
  data: AppData;
  todaySession: StudySession;
  setTodaySession: (nextSession: StudySession) => void;
  completeTodaySession: () => void;
  syncSessionSentences: (sessionId: string, sentences: Sentence[]) => void;
  reviewSentence: (sentenceId: string) => void;
  updateSentence: (sentence: Sentence) => void;
  deleteSentence: (sentenceId: string) => void;
  saveRecording: (payload: Omit<Recording, "id" | "blobKey" | "createdAt">, blob: Blob) => Promise<Recording>;
  deleteRecording: (recordingId: string) => Promise<void>;
  replaceAllData: (payload: BackupPayload) => Promise<void>;
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => ensureTodaySession(loadAppData()));

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  const todayKey = getLocalDateKey();
  const todaySession = data.sessions.find((session) => session.date === todayKey) ?? createEmptySession();

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
      monthlyGoalDays: 30,
    });

    setData(nextData);
  }

  useEffect(() => {
    const todayMissing = !data.sessions.some((session) => session.date === todayKey);
    if (todayMissing) {
      setData((current) => ensureTodaySession(current));
    }
  }, [data.sessions, todayKey]);

  return (
    <AppContext.Provider
      value={{
        data,
        todaySession,
        setTodaySession,
        completeTodaySession,
        syncSessionSentences,
        reviewSentence,
        updateSentence,
        deleteSentence,
        saveRecording,
        deleteRecording,
        replaceAllData,
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
