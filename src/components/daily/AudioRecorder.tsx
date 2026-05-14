import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Mic, PauseCircle, Save, Trash2 } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { getAudioBlob } from "../../storage/indexedDb";
import type { RecordingType } from "../../types/study";

type RecorderStatus = "idle" | "recording" | "stopped" | "saved";

interface AudioRecorderProps {
  sessionId: string;
  recordingType: RecordingType;
  recordingId?: string;
  onSaved: (recordingId: string, duration: number) => void;
  onDeleted: () => void;
}

export function AudioRecorder({ sessionId, recordingType, recordingId, onSaved, onDeleted }: AudioRecorderProps) {
  const { data, saveRecording, deleteRecording } = useAppContext();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [duration, setDuration] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);

  const existingRecording = data.recordings.find((recording) => recording.id === recordingId);

  useEffect(() => {
    let active = true;

    async function loadSavedRecording() {
      if (!existingRecording) {
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setStatus("idle");
        setDuration(0);
        return;
      }

      const blob = await getAudioBlob(existingRecording.blobKey);
      if (!blob || !active) {
        return;
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      setPreviewUrl(URL.createObjectURL(blob));
      setDuration(existingRecording.duration);
      setStatus("saved");
    }

    void loadSavedRecording();

    return () => {
      active = false;
    };
  }, [existingRecording]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [previewUrl]);

  async function startRecording() {
    setError("");

    if (!("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia) {
      setError("当前浏览器不支持录音。你仍然可以继续填写文本和自评。");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      startTimeRef.current = Date.now();
      setPendingBlob(null);
      setDuration(0);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
        }

        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const nextDuration = Math.max(Math.round((Date.now() - startTimeRef.current) / 1000), 1);

        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }

        setPendingBlob(blob);
        setPreviewUrl(URL.createObjectURL(blob));
        setDuration(nextDuration);
        setStatus("stopped");
        streamRef.current?.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      timerRef.current = window.setInterval(() => {
        setDuration(Math.max(Math.floor((Date.now() - startTimeRef.current) / 1000), 0));
      }, 250);
      setStatus("recording");
    } catch {
      setError("麦克风权限未开启或录音启动失败。你仍然可以先完成文本练习。");
    }
  }

  function stopRecording() {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current?.stop();
  }

  async function handleSaveRecording() {
    if (!pendingBlob) {
      return;
    }

    setIsSaving(true);
    try {
      const savedRecording = await saveRecording(
        {
          sessionId,
          type: recordingType,
          duration,
          mimeType: pendingBlob.type || "audio/webm",
        },
        pendingBlob,
      );

      if (recordingId) {
        await deleteRecording(recordingId);
      }

      onSaved(savedRecording.id, savedRecording.duration);
      setPendingBlob(null);
      setStatus("saved");
    } catch {
      setError("录音保存失败，不过页面内容仍然会保留。");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteSavedRecording() {
    if (!recordingId) {
      setPendingBlob(null);
      setPreviewUrl(null);
      setDuration(0);
      setStatus("idle");
      return;
    }

    await deleteRecording(recordingId);
    onDeleted();
    setPendingBlob(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setDuration(0);
    setStatus("idle");
  }

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/85 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">状态：{status === "idle" ? "未开始" : status === "recording" ? "录音中" : status === "stopped" ? "已停止" : "已保存"}</span>
        <span className="text-sm text-slate-500">录音时长：{duration} 秒</span>
      </div>

      {error ? <p className="mt-3 text-sm text-amber-600">{error}</p> : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={startRecording}
          disabled={status === "recording"}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          <Mic className="h-4 w-4" />
          开始录音
        </button>
        <button
          type="button"
          onClick={stopRecording}
          disabled={status !== "recording"}
          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 disabled:opacity-40"
        >
          <PauseCircle className="h-4 w-4" />
          停止录音
        </button>
        <button
          type="button"
          onClick={handleSaveRecording}
          disabled={status !== "stopped" || isSaving}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm text-white disabled:opacity-40"
        >
          {isSaving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          保存录音
        </button>
        <button
          type="button"
          onClick={() => void handleDeleteSavedRecording()}
          disabled={status === "recording" || (!previewUrl && !recordingId)}
          className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
          删除重录
        </button>
      </div>

      {previewUrl ? (
        <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
          <audio controls src={previewUrl} className="w-full" />
        </div>
      ) : null}
    </div>
  );
}
