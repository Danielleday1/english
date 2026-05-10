import { useState } from "react";
import { useAppContext } from "../../context/AppContext";
import type { StudySession } from "../../types/study";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { EmptyState } from "../common/EmptyState";
import { RecordingPlayer } from "../common/RecordingPlayer";

interface IELTSSpeakingListProps {
  sessions: StudySession[];
}

export function IELTSSpeakingList({ sessions }: IELTSSpeakingListProps) {
  const { deleteRecording } = useAppContext();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const speakingSessions = sessions.filter((session) => session.ieltsSpeaking.recordingId || session.ieltsSpeaking.transcript.trim());

  if (speakingSessions.length === 0) {
    return <EmptyState title="还没有雅思记录" description="先完成一次 Section 或一次口语录音。" />;
  }

  return (
    <div className="space-y-4">
      {speakingSessions.map((session) => (
        <article key={session.id} className="panel-soft p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-400">{session.date}</p>
                <h3 className="mt-1 text-lg font-semibold text-ink">Part {session.ieltsSpeaking.part}</h3>
              </div>
              <p className="text-sm text-slate-500">{session.ieltsSpeaking.prompt || "还没有填写题目"}</p>
              <p className="text-sm leading-7 text-slate-500">{session.ieltsSpeaking.transcript || "还没有填写回答文本"}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 text-sm text-slate-600">
              <p>Fluency: {session.ieltsSpeaking.scores.fluencyCoherence}/5</p>
              <p>Lexical: {session.ieltsSpeaking.scores.lexicalResource}/5</p>
              <p>Grammar: {session.ieltsSpeaking.scores.grammarRangeAccuracy}/5</p>
              <p>Pronunciation: {session.ieltsSpeaking.scores.pronunciation}/5</p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="space-y-4">
              <RecordingPlayer recordingId={session.ieltsSpeaking.recordingId} />
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white/80 p-4">
                  <p className="text-sm text-slate-400">今日问题</p>
                  <p className="mt-2 text-sm text-slate-600">{session.ieltsSpeaking.problems || "还没有记录"}</p>
                </div>
                <div className="rounded-2xl bg-white/80 p-4">
                  <p className="text-sm text-slate-400">改进方向</p>
                  <p className="mt-2 text-sm text-slate-600">{session.ieltsSpeaking.improvement || "还没有记录"}</p>
                </div>
              </div>
            </div>
            {session.ieltsSpeaking.recordingId ? (
              <button
                type="button"
                onClick={() => setPendingDeleteId(session.ieltsSpeaking.recordingId ?? null)}
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
    </div>
  );
}
