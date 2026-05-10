import type { StudySession } from "../../types/study";
import { EmptyState } from "../common/EmptyState";
import { StatCard } from "../common/StatCard";

interface IELTSListeningStatsProps {
  sessions: StudySession[];
}

export function IELTSListeningStats({ sessions }: IELTSListeningStatsProps) {
  const listeningSessions = sessions.filter((session) => session.ieltsListening.totalQuestions > 0);
  if (listeningSessions.length === 0) {
    return <EmptyState title="还没有雅思记录" description="先完成一次 Section 或一次口语录音。" />;
  }

  function average(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  const currentMonth = new Date().getMonth();
  const currentWeek = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const weekAccuracy = average(
    listeningSessions
      .filter((session) => new Date(session.updatedAt).getTime() >= currentWeek)
      .map((session) => session.ieltsListening.accuracy),
  );
  const monthAccuracy = average(
    listeningSessions
      .filter((session) => new Date(session.updatedAt).getMonth() === currentMonth)
      .map((session) => session.ieltsListening.accuracy),
  );

  function sectionAccuracy(section: 1 | 2 | 3 | 4): number {
    return average(
      listeningSessions
        .filter((session) => session.ieltsListening.section === section)
        .map((session) => session.ieltsListening.accuracy),
    );
  }

  const questionTypes = Array.from(
    new Map(
      listeningSessions.map((session) => [
        session.ieltsListening.questionType,
        average(
          listeningSessions
            .filter((item) => item.ieltsListening.questionType === session.ieltsListening.questionType)
            .map((item) => item.ieltsListening.accuracy),
        ),
      ]),
    ).entries(),
  );

  const errorCounts = new Map<string, number>();
  listeningSessions.forEach((session) => {
    session.ieltsListening.errorReasons.forEach((reason) => {
      errorCounts.set(reason, (errorCounts.get(reason) ?? 0) + 1);
    });
  });

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="本周平均正确率" value={`${weekAccuracy}%`} />
        <StatCard label="本月平均正确率" value={`${monthAccuracy}%`} />
        <StatCard label="Section 1 正确率" value={`${sectionAccuracy(1)}%`} />
        <StatCard label="Section 2 正确率" value={`${sectionAccuracy(2)}%`} />
        <StatCard label="Section 3 正确率" value={`${sectionAccuracy(3)}%`} />
        <StatCard label="Section 4 正确率" value={`${sectionAccuracy(4)}%`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="panel-soft p-5">
          <h3 className="text-lg font-semibold text-ink">题型正确率</h3>
          <div className="mt-4 space-y-3">
            {questionTypes.map(([type, accuracy]) => (
              <div key={type} className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-600">
                <span>{type}</span>
                <span>{accuracy}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-soft p-5">
          <h3 className="text-lg font-semibold text-ink">错因统计排行</h3>
          <div className="mt-4 space-y-3">
            {[...errorCounts.entries()]
              .sort((left, right) => right[1] - left[1])
              .slice(0, 7)
              .map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-600">
                  <span>{reason}</span>
                  <span>{count} 次</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
