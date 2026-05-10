import type { StudySession } from "../../types/study";
import { EmptyState } from "../common/EmptyState";
import { Tag } from "../common/Tag";

interface IELTSListeningListProps {
  sessions: StudySession[];
}

export function IELTSListeningList({ sessions }: IELTSListeningListProps) {
  const listeningSessions = sessions.filter((session) => session.ieltsListening.totalQuestions > 0);

  if (listeningSessions.length === 0) {
    return <EmptyState title="还没有雅思记录" description="先完成一次 Section 或一次口语录音。" />;
  }

  return (
    <div className="space-y-4">
      {listeningSessions.map((session) => (
        <article key={session.id} className="panel-soft p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm text-slate-400">{session.date}</p>
              <h3 className="mt-1 text-lg font-semibold text-ink">{session.ieltsListening.materialName}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              <Tag>Section {session.ieltsListening.section}</Tag>
              <Tag tone="info">{session.ieltsListening.questionType}</Tag>
              <Tag tone="success">{session.ieltsListening.accuracy}%</Tag>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm text-slate-400">错误原因</p>
              <p className="mt-1 text-sm text-slate-600">{session.ieltsListening.errorReasons.join("、") || "还没有记录"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">错题笔记</p>
              <p className="mt-1 text-sm text-slate-600">{session.ieltsListening.notes || "还没有记录"}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">下次注意事项</p>
              <p className="mt-1 text-sm text-slate-600">{session.ieltsListening.nextFocus || "还没有记录"}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
