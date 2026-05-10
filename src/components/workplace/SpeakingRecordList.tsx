import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import type { StudySession } from "../../types/study";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { EmptyState } from "../common/EmptyState";
import { RecordingPlayer } from "../common/RecordingPlayer";

interface SpeakingRecordListProps {
  sessions: StudySession[];
}

export function SpeakingRecordList({ sessions }: SpeakingRecordListProps) {
  const { deleteRecording } = useAppContext();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const workplaceSessions = sessions.filter(
    (session) => session.workplaceSpeaking.recordingId || session.workplaceSpeaking.transcript.trim(),
  );

  if (workplaceSessions.length === 0) {
    return <EmptyState title="还没有录音" description="先说满 60 秒，不需要完美。" />;
  }

  return (
    <section className="space-y-4">
      {workplaceSessions.map((session) => (
        <article key={session.id} className="panel-soft p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm text-slate-400">{session.date}</p>
              <h3 className="mt-1 text-lg font-semibold text-ink">{session.material.title || session.material.topic}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-500">{session.workplaceSpeaking.transcript || "还没有填写文本复述。"}</p>
            </div>

            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm text-slate-400">自评分</p>
              <p className="mt-2 text-sm text-slate-600">流畅度 {session.workplaceSpeaking.fluencyScore}/5</p>
              <p className="text-sm text-slate-600">清晰度 {session.workplaceSpeaking.clarityScore}/5</p>
              <p className="text-sm text-slate-600">自信度 {session.workplaceSpeaking.confidenceScore}/5</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <RecordingPlayer recordingId={session.workplaceSpeaking.recordingId} />
            {session.workplaceSpeaking.recordingId ? (
              <button
                type="button"
                onClick={() => setPendingDeleteId(session.workplaceSpeaking.recordingId ?? null)}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600"
              >
                删除录音
              </button>
            ) : null}
          </div>
        </article>
      ))}

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="删除这条录音？"
        description="删除后录音文件会从本地 IndexedDB 中移除。"
        confirmLabel="确认删除"
        onConfirm={() => {
          if (pendingDeleteId) {
            void deleteRecording(pendingDeleteId);
          }
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </section>
  );
}
