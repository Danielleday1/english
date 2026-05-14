import { ArrowRight, BookOpenText, Mic2, Radio, Sparkles } from "lucide-react";
import { PageHeader } from "../components/layout/PageHeader";
import { StatCard } from "../components/common/StatCard";
import { EmptyState } from "../components/common/EmptyState";
import { ProgressBar } from "../components/common/ProgressBar";
import { Tag } from "../components/common/Tag";
import type { DashboardStats, StudySession } from "../types/study";
import { minutesToLabel } from "../utils/date";
import { calculateSessionProgress, getEffectiveActualMinutes } from "../utils/study";
import { getPracticeSummary, normalizePracticeSession } from "../utils/practiceMode";

interface DashboardPageProps {
  stats: DashboardStats;
  todaySession: StudySession;
  recentSession?: StudySession;
  onStart: () => void;
}

function getTodayStatus(session: StudySession): string {
  if (session.isCompleted) {
    return "已完成";
  }

  if (session.completedSteps.length > 0 || session.material.title.trim()) {
    return "进行中";
  }

  return "未开始";
}

export function DashboardPage({ stats, todaySession, recentSession, onStart }: DashboardPageProps) {
  const normalizedTodaySession = normalizePracticeSession(todaySession);
  const hasDraft = !normalizedTodaySession.isCompleted && (normalizedTodaySession.completedSteps.length > 0 || normalizedTodaySession.material.title.trim());
  const sentenceCount = normalizedTodaySession.sentences.filter((sentence) => sentence.text.trim()).length;
  const todayActualMinutes = getEffectiveActualMinutes(normalizedTodaySession);
  const todaySummary = getPracticeSummary(normalizedTodaySession);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="早上好，小泥团"
        description="今天选择一个训练模式，完成一个闭环，让口语和听力都往前走一步。"
        actions={
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-slate-900/10"
          >
            {hasDraft ? "继续今天的练习" : "开始今日练习"}
            <ArrowRight className="h-4 w-4" />
          </button>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="panel-soft p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-sky-600" />
            <h3 className="text-lg font-semibold text-ink">今日任务摘要</h3>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white/85 p-4">
              <p className="text-sm text-slate-400">今日目标</p>
              <p className="mt-2 text-base font-semibold text-ink">{normalizedTodaySession.plannedMinutes} 分钟</p>
            </div>
            <div className="rounded-2xl bg-white/85 p-4">
              <p className="text-sm text-slate-400">今日状态</p>
              <div className="mt-2">
                <Tag tone={normalizedTodaySession.isCompleted ? "success" : "neutral"}>{getTodayStatus(normalizedTodaySession)}</Tag>
              </div>
            </div>
            <div className="rounded-2xl bg-white/85 p-4">
              <p className="text-sm text-slate-400">今日模式</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{todaySummary.label}</p>
            </div>
            <div className="rounded-2xl bg-white/85 p-4">
              <p className="text-sm text-slate-400">任务摘要</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{todaySummary.detail}</p>
            </div>
          </div>
          <div className="mt-5">
            <ProgressBar value={calculateSessionProgress(normalizedTodaySession)} label="今日推进进度" />
          </div>
        </article>

        <article className="panel-soft p-6">
          <div className="flex items-center gap-2">
            <BookOpenText className="h-4 w-4 text-slate-500" />
            <h3 className="text-lg font-semibold text-ink">如果你现在就开始</h3>
          </div>
          <ul className="mt-5 space-y-3 text-sm leading-7 text-slate-500">
            <li>先听 1–2 分钟，不看字幕，只抓关键词。</li>
            <li>把今天真正会用到的 3 句表达留下来。</li>
            <li>完成这一小步。</li>
            <li>今天不需要完美，只需要完成闭环。</li>
          </ul>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm text-slate-400">今日草稿句子</p>
              <p className="mt-2 text-base font-semibold text-ink">{sentenceCount} 句</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm text-slate-400">今日实际分钟</p>
              <p className="mt-2 text-base font-semibold text-ink">{minutesToLabel(todayActualMinutes)}</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="连续打卡天数" value={`${stats.streakDays} 天`} icon={<Sparkles className="h-4 w-4 text-sky-600" />} />
        <StatCard label="本月已练习分钟数" value={`${stats.monthlyMinutes} 分钟`} icon={<Radio className="h-4 w-4 text-slate-500" />} />
        <StatCard label="累计口语输出分钟数" value={`${stats.totalSpeakingMinutes} 分钟`} icon={<Mic2 className="h-4 w-4 text-emerald-600" />} />
        <StatCard label="收藏职场句子数量" value={`${stats.sentenceCount} 句`} />
        <StatCard label="雅思听力平均正确率" value={`${stats.averageIELTSAccuracy}%`} />
        <StatCard label="本周完成率" value={`${stats.weeklyCompletionRate}%`} />
      </section>

      {recentSession ? (
        <section className="panel-soft p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-ink">最近一次练习</h3>
            <Tag tone="success">{recentSession.date}</Tag>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm text-slate-400">材料标题</p>
              <p className="mt-2 text-sm text-slate-600">{recentSession.material.title || "还没有填写"}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm text-slate-400">盲听听懂程度</p>
              <p className="mt-2 text-lg font-semibold text-ink">{recentSession.blindListening.comprehension}%</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm text-slate-400">精听听懂程度</p>
              <p className="mt-2 text-lg font-semibold text-ink">{recentSession.intensiveListening.comprehension}%</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm text-slate-400">职场口语输出时长</p>
              <p className="mt-2 text-lg font-semibold text-ink">{recentSession.workplaceSpeaking.duration} 秒</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm text-slate-400">雅思听力正确率</p>
              <p className="mt-2 text-lg font-semibold text-ink">{recentSession.ieltsListening.accuracy}%</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-sm text-slate-400">收藏句子数量</p>
              <p className="mt-2 text-lg font-semibold text-ink">{recentSession.sentences.filter((sentence) => sentence.text.trim()).length}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 md:col-span-2">
              <p className="text-sm text-slate-400">今日复盘摘要</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">{recentSession.review.biggestGain || "还没有留下复盘摘要。"}</p>
            </div>
          </div>
        </section>
      ) : (
        <EmptyState title="还没有练习记录" description="今天就从第一段 1 分钟英文开始。" />
      )}
    </div>
  );
}
