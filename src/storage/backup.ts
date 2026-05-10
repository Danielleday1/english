import type { AppData, BackupPayload, FullBackupPayload, TextBackupPayload } from "../types/study";
import { deriveMaterials, calculateDashboardStats, getErrorReasonStats } from "./statistics";

export function buildTextBackup(data: AppData): TextBackupPayload {
  return {
    version: 1,
    backupType: "text",
    exportedAt: new Date().toISOString(),
    data: {
      sessions: data.sessions,
      materials: deriveMaterials(data.sessions),
      sentences: data.sentenceBank,
      monthlyGoalDays: data.monthlyGoalDays,
      statistics: {
        dashboard: calculateDashboardStats(data),
        errorReasons: getErrorReasonStats(data.sessions),
      },
      recordings: data.recordings,
    },
  };
}

export function buildFullBackup(
  data: AppData,
  audioBlobs: FullBackupPayload["data"]["audioBlobs"],
): FullBackupPayload {
  return {
    ...buildTextBackup(data),
    backupType: "full",
    data: {
      ...buildTextBackup(data).data,
      audioBlobs,
    },
  };
}

export function parseBackupPayload(raw: string): BackupPayload {
  const parsed = JSON.parse(raw) as BackupPayload;
  if (!parsed || typeof parsed !== "object" || !("data" in parsed) || !("backupType" in parsed)) {
    throw new Error("JSON 格式不正确。");
  }

  if (parsed.backupType !== "text" && parsed.backupType !== "full") {
    throw new Error("不支持的备份类型。");
  }

  if (!Array.isArray(parsed.data.sessions) || !Array.isArray(parsed.data.sentences) || !Array.isArray(parsed.data.recordings)) {
    throw new Error("备份数据缺少必要字段。");
  }

  return parsed;
}
