import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { MONTHLY_GOAL_DAYS } from "../constants/options";
import type { AppData, CloudSnapshotPayload, Recording } from "../types/study";
import { buildTextBackup } from "./backup";
import { clearAudioStore, getAudioBlob, saveAudioBlob } from "./indexedDb";

const SNAPSHOT_TABLE = "english_app_snapshots";
const RECORDING_BUCKET = "english-recordings";
const AUTH_STORAGE_KEY = "xiaonituan-english-supabase-auth";

interface SnapshotRow {
  user_id: string;
  payload: CloudSnapshotPayload;
  updated_at: string;
}

let supabaseClient: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
}

function getSupabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";
}

export function isCloudSyncConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (!isCloudSyncConfigured()) {
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
        storageKey: AUTH_STORAGE_KEY,
      },
    });
  }

  return supabaseClient;
}

function getClientOrThrow(): SupabaseClient {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error("云端同步还没有配置好，请先补上 Supabase 环境变量。");
  }

  return client;
}

function getRecordingExtension(mimeType: string): string {
  if (mimeType.includes("webm")) {
    return "webm";
  }

  if (mimeType.includes("wav")) {
    return "wav";
  }

  if (mimeType.includes("mp4") || mimeType.includes("mpeg")) {
    return "mp4";
  }

  if (mimeType.includes("ogg")) {
    return "ogg";
  }

  return "bin";
}

function getCloudPath(userId: string, recording: Recording): string {
  return recording.cloudPath ?? `${userId}/${recording.id}.${getRecordingExtension(recording.mimeType)}`;
}

function buildAppDataFromSnapshot(snapshot: CloudSnapshotPayload): AppData {
  return {
    sessions: snapshot.data.sessions ?? [],
    sentenceBank: snapshot.data.sentences ?? [],
    recordings: snapshot.data.recordings ?? [],
    monthlyGoalDays: snapshot.data.monthlyGoalDays ?? MONTHLY_GOAL_DAYS,
  };
}

async function getCurrentUserOrThrow(): Promise<User> {
  const client = getClientOrThrow();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("请先登录同一个邮箱，再进行云端同步。");
  }

  return user;
}

async function uploadRecordings(client: SupabaseClient, userId: string, recordings: Recording[]): Promise<Recording[]> {
  const syncedAt = new Date().toISOString();
  const nextRecordings: Recording[] = [];

  for (const recording of recordings) {
    const blob = await getAudioBlob(recording.blobKey);
    if (!blob) {
      nextRecordings.push(recording);
      continue;
    }

    const cloudPath = getCloudPath(userId, recording);
    const { error } = await client.storage.from(RECORDING_BUCKET).upload(cloudPath, blob, {
      upsert: true,
      contentType: recording.mimeType,
    });

    if (error) {
      throw error;
    }

    nextRecordings.push({
      ...recording,
      cloudPath,
      syncedAt,
    });
  }

  return nextRecordings;
}

async function fetchSnapshotRow(): Promise<SnapshotRow | null> {
  const client = getClientOrThrow();
  const user = await getCurrentUserOrThrow();
  const { data, error } = await client
    .from(SNAPSHOT_TABLE)
    .select("user_id, payload, updated_at")
    .eq("user_id", user.id)
    .maybeSingle<SnapshotRow>();

  if (error) {
    throw error;
  }

  return data;
}

export async function getCloudUser(): Promise<User | null> {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return null;
  }

  const {
    data: { user },
  } = await client.auth.getUser();

  return user;
}

export function subscribeToCloudAuth(callback: (user: User | null) => void): (() => void) | null {
  const client = getSupabaseBrowserClient();
  if (!client) {
    return null;
  }

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}

export async function requestMagicLink(email: string): Promise<void> {
  const client = getClientOrThrow();
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  const { error } = await client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOutCloud(): Promise<void> {
  const client = getClientOrThrow();
  const { error } = await client.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function fetchCloudSnapshotMeta(): Promise<{ hasSnapshot: boolean; remoteUpdatedAt?: string }> {
  const row = await fetchSnapshotRow();
  return {
    hasSnapshot: Boolean(row),
    remoteUpdatedAt: row?.updated_at,
  };
}

export async function pushDataToCloud(data: AppData): Promise<{ syncedAt: string; remoteUpdatedAt: string }> {
  const client = getClientOrThrow();
  const user = await getCurrentUserOrThrow();
  const textBackup = buildTextBackup(data);
  const recordings = await uploadRecordings(client, user.id, data.recordings);
  const snapshot: CloudSnapshotPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    data: {
      sessions: data.sessions,
      sentences: data.sentenceBank,
      recordings,
      monthlyGoalDays: data.monthlyGoalDays,
    },
  };

  const { error } = await client.from(SNAPSHOT_TABLE).upsert(
    {
      user_id: user.id,
      payload: {
        ...snapshot,
        exportedAt: textBackup.exportedAt,
      },
      updated_at: snapshot.updatedAt,
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    throw error;
  }

  return {
    syncedAt: snapshot.exportedAt,
    remoteUpdatedAt: snapshot.updatedAt,
  };
}

export async function pullDataFromCloud(options?: { clearExistingAudio?: boolean }): Promise<{ data: AppData; syncedAt: string; remoteUpdatedAt: string }> {
  const client = getClientOrThrow();
  const row = await fetchSnapshotRow();
  if (!row) {
    throw new Error("云端还没有可恢复的数据。先在一台电脑上上传一次当前记录。");
  }

  const recordingsToRestore: Array<{ blobKey: string; blob: Blob }> = [];
  for (const recording of row.payload.data.recordings) {
    if (!recording.cloudPath) {
      continue;
    }

    const { data: blob, error } = await client.storage.from(RECORDING_BUCKET).download(recording.cloudPath);
    if (error) {
      throw error;
    }

    recordingsToRestore.push({
      blobKey: recording.blobKey,
      blob,
    });
  }

  if (options?.clearExistingAudio !== false) {
    await clearAudioStore();
  }

  for (const item of recordingsToRestore) {
    await saveAudioBlob(item.blobKey, item.blob);
  }

  return {
    data: buildAppDataFromSnapshot(row.payload),
    syncedAt: row.payload.exportedAt,
    remoteUpdatedAt: row.updated_at,
  };
}
