import { useAppContext } from "../../context/AppContext";
import type { WeeklyReviewData } from "../../types/study";
import { formatShortDate, minutesToLabel } from "../../utils/date";
import { EmptyState } from "../common/EmptyState";
import { StatCard } from "../common/StatCard";
import { Tag } from "../common/Tag";

interface WeeklyReviewPanelProps {
  weeklyReview: WeeklyReviewData;
}

export function WeeklyReviewPanel({ weeklyReview }: WeeklyReviewPanelProps) {
  const { reviewSentence } = useAppContext();
  const hasData =
    weeklyReview.completedSessions > 0 ||
    weeklyReview.topSentences.length > 0 ||
    weeklyReview.biggestGains.length > 0 ||
    weeklyReview.biggestProblems.length > 0 ||
    weeklyReview.nextFocuses.length > 0;

  if (!hasData) {
    return <EmptyState title="还没有本周复习内容" description="先完成几次练习，本周复习板块就会自动把重点帮你整理出来。" />;
  }

  return (
    <div className="space-y-4">
      <div className="panel-soft p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-ink">每周复习</h3>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              {formatShortDate(weeklyReview.weekStart)} - {formatShortDate(weeklyReview.weekEnd)}。每周来这里看一次，就能知道这一周真正往前走了什么。
            </p>
          </div>
          <Tag tone="info">本周 {weeklyReview.completedDays} / 7 天</Tag>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="本周总练习时长" value={minutesToLabel(weeklyReview.totalMinutes)} />
        <StatCard label="本周完成次数" value={`${weeklyReview.completedSessions} 次`} />
        <StatCard label="盲听平均听懂度" value={`${weeklyReview.averageBlindComprehension}%`} />
        <StatCard label="精听平均听懂度" value={`${weeklyReview.averageIntensiveComprehension}%`} />
        <StatCard label="雅思听力平均正确率" value={`${weeklyReview.averageIELTSAccuracy}%`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="panel-soft p-5">
          <h4 className="text-lg font-semibold text-ink">本周优先复习句子</h4>
          <div className="mt-4 space-y-3">
            {weeklyReview.topSentences.length > 0 ? (
              weeklyReview.topSentences.map((sentence) => (
                <div key={sentence.id} className="rounded-2xl bg-white/80 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-ink">{sentence.text}</p>
                    {sentence.mastery === "weak" ? <Tag tone="success">优先复习</Tag> : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{sentence.translation}</p>
                  <button
                    type="button"
                    onClick={() => reviewSentence(sentence.id)}
                    className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
                  >
                    复习一次
                  </button>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">这周还没有需要优先复习的句子。</p>
            )}
          </div>
        </section>

        <section className="panel-soft p-5">
          <h4 className="text-lg font-semibold text-ink">本周高频错因</h4>
          <div className="mt-4 space-y-3">
            {weeklyReview.topErrorReasons.length > 0 ? (
              weeklyReview.topErrorReasons.map((item) => (
                <div key={item.reason} className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-600">
                  <span>{item.reason}</span>
                  <span>{item.count} 次</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">这周还没有明显集中的错因。</p>
            )}
          </div>
        </section>

        <section className="panel-soft p-5">
          <h4 className="text-lg font-semibold text-ink">这周最大的收获</h4>
          <div className="mt-4 space-y-3">
            {weeklyReview.biggestGains.length > 0 ? (
              weeklyReview.biggestGains.map((gain) => (
                <div key={gain} className="rounded-2xl bg-white/80 p-4 text-sm leading-7 text-slate-600">
                  {gain}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">这周还没有留下收获记录。</p>
            )}
          </div>
        </section>

        <section className="panel-soft p-5">
          <h4 className="text-lg font-semibold text-ink">下周继续盯住这些点</h4>
          <div className="mt-4 space-y-3">
            {weeklyReview.nextFocuses.length > 0 ? (
              weeklyReview.nextFocuses.map((focus) => (
                <div key={focus} className="rounded-2xl bg-white/80 p-4 text-sm leading-7 text-slate-600">
                  {focus}
                </div>
              ))
            ) : weeklyReview.biggestProblems.length > 0 ? (
              weeklyReview.biggestProblems.map((problem) => (
                <div key={problem} className="rounded-2xl bg-white/80 p-4 text-sm leading-7 text-slate-600">
                  {problem}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">这周还没有形成明确的下周重点。</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
