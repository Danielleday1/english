import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ExportImportPanel } from "../components/progress/ExportImportPanel";
import { ChartCard } from "../components/progress/ChartCard";
import { CloudSyncPanel } from "../components/progress/CloudSyncPanel";
import { ReviewQueue } from "../components/progress/ReviewQueue";
import { WeeklyReviewPanel } from "../components/progress/WeeklyReviewPanel";
import { PageHeader } from "../components/layout/PageHeader";
import { StatCard } from "../components/common/StatCard";
import type { DashboardStats, ErrorReasonStat, ReviewQueueData, TrendPoint, WeeklyReviewData } from "../types/study";

interface ProgressPageProps {
  stats: DashboardStats;
  trends: TrendPoint[];
  errorReasons: ErrorReasonStat[];
  reviewQueue: ReviewQueueData;
  weeklyReview: WeeklyReviewData;
}

export function ProgressPage({ stats, trends, errorReasons, reviewQueue, weeklyReview }: ProgressPageProps) {
  const hasData = trends.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Progress & Review"
        title="你的进步应该看起来清楚、安静，而且真实"
        description="不做复杂数据大屏，只保留每天训练后真正有帮助的曲线和复习线索。"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="连续打卡天数" value={`${stats.streakDays} 天`} />
        <StatCard label="本月已练习分钟数" value={`${stats.monthlyMinutes} 分钟`} />
        <StatCard label="本周完成率" value={`${stats.weeklyCompletionRate}%`} />
      </div>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-ink">云端同步</h3>
        <CloudSyncPanel />
      </section>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-ink">本周复习板块</h3>
        <WeeklyReviewPanel weeklyReview={weeklyReview} />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="每日练习分钟数趋势" description="每天留下一条线，不需要完美，只要持续。" hasData={hasData}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="minutes" stroke="#334155" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="盲听与精听听懂程度变化" description="两条线分开看，更容易知道自己是在输入阶段卡住，还是理解阶段卡住。" hasData={hasData}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="blindComprehension" stroke="#7c8fa1" strokeWidth={2.2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="intensiveComprehension" stroke="#0f172a" strokeWidth={2.2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="职场口语输出时长变化" description="只要你持续开口，这条线就会慢慢往上走。" hasData={hasData}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="workplaceSpeaking" fill="#475569" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="雅思听力正确率与口语练习次数" description="一边看正确率，一边看开口次数，避免只刷题不输出。" hasData={hasData}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="ieltsAccuracy" stroke="#0284c7" strokeWidth={2.2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="ieltsSpeakingCount" stroke="#16a34a" strokeWidth={2.2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="收藏句子数量变化" description="句子越挑越准，比一口气记很多更重要。" hasData={hasData}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="sentenceCount" fill="#94a3b8" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="高频错误原因排行" description="先把最常见的问题打掉，提分会更直接。" hasData={errorReasons.length > 0}>
          <div className="space-y-3">
            {errorReasons.slice(0, 7).map((item) => (
              <div key={item.reason} className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-600">
                <span>{item.reason}</span>
                <span>{item.count} 次</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      <section className="space-y-4">
        <h3 className="text-xl font-semibold text-ink">复习区</h3>
        <ReviewQueue queue={reviewQueue} />
      </section>

      <ExportImportPanel />
    </div>
  );
}
