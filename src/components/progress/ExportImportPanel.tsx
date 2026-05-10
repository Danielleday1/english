import { useRef, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { buildFullBackup, buildTextBackup, parseBackupPayload } from "../../storage/backup";
import { blobToBase64, getAudioBlob } from "../../storage/indexedDb";
import { ConfirmDialog } from "../common/ConfirmDialog";

function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ExportImportPanel() {
  const { data, replaceAllData } = useAppContext();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState("");
  const [pendingImportText, setPendingImportText] = useState<string | null>(null);

  async function handleExportText() {
    downloadJson(`english-camp-text-backup-${Date.now()}.json`, buildTextBackup(data));
    setMessage("文字数据导出完成。");
  }

  async function handleExportFull() {
    const audioBlobs: Array<{ blobKey: string; mimeType: string; base64: string }> = [];
    for (const recording of data.recordings) {
      const blob = await getAudioBlob(recording.blobKey);
      if (!blob) {
        continue;
      }

      audioBlobs.push({
        blobKey: recording.blobKey,
        mimeType: recording.mimeType,
        base64: await blobToBase64(blob),
      });
    }

    downloadJson(`english-camp-full-backup-${Date.now()}.json`, buildFullBackup(data, audioBlobs));
    setMessage("完整备份导出完成。");
  }

  async function handleImportConfirmed() {
    if (!pendingImportText) {
      return;
    }

    try {
      const payload = parseBackupPayload(pendingImportText);
      await replaceAllData(payload);
      setMessage("导入完成，本地数据已恢复。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导入失败，JSON 可能不正确。");
    } finally {
      setPendingImportText(null);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  return (
    <section className="panel-soft p-5">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-ink">数据备份</h3>
        <p className="text-sm leading-7 text-slate-500">导入会覆盖当前本地数据，请先确认已备份。</p>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={() => void handleExportText()} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
          导出文字数据 JSON
        </button>
        <button type="button" onClick={() => void handleExportFull()} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
          导出完整备份 JSON
        </button>
        <label className="rounded-full bg-white px-4 py-2 text-sm text-slate-600">
          导入 JSON
          <input
            ref={inputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                return;
              }

              const reader = new FileReader();
              reader.onerror = () => setMessage("导入失败，文件无法读取。");
              reader.onload = () => {
                if (typeof reader.result === "string") {
                  setPendingImportText(reader.result);
                }
              };
              reader.readAsText(file);
            }}
          />
        </label>
      </div>

      <p className="mt-3 text-sm text-amber-600">完整备份会包含录音，文件可能较大。</p>
      {message ? <p className="mt-3 text-sm text-slate-500">{message}</p> : null}

      <ConfirmDialog
        open={Boolean(pendingImportText)}
        title="确认导入备份？"
        description="导入会覆盖当前本地数据，请先确认已备份。"
        confirmLabel="确认导入"
        onConfirm={() => void handleImportConfirmed()}
        onCancel={() => {
          setPendingImportText(null);
          if (inputRef.current) {
            inputRef.current.value = "";
          }
        }}
      />
    </section>
  );
}
