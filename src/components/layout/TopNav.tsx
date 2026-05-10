import clsx from "clsx";
import { Flame, Target, TrendingUp } from "lucide-react";

export type AppPage = "dashboard" | "daily" | "workplace" | "ielts" | "progress";

interface TopNavProps {
  appTitle: string;
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  streakDays: number;
  todayProgress: number;
  monthlyGoal: number;
}

const NAV_ITEMS: Array<{ id: AppPage; label: string }> = [
  { id: "dashboard", label: "首页 Dashboard" },
  { id: "daily", label: "今日练习 Daily Practice" },
  { id: "workplace", label: "职场英语 Workplace English" },
  { id: "ielts", label: "雅思训练 IELTS Training" },
  { id: "progress", label: "复盘 Progress & Review" },
];

export function TopNav({ appTitle, currentPage, onNavigate, streakDays, todayProgress, monthlyGoal }: TopNavProps) {
  return (
    <header className="panel animate-fade-up px-4 py-4 sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Personal Workspace</p>
          <div>
            <h1 className="text-xl font-semibold text-ink sm:text-2xl">{appTitle}</h1>
            <p className="subtle-text">一个安静、可靠、每天都会接住你的英语训练台。</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Flame className="h-4 w-4 text-amber-500" />
              连续打卡
            </div>
            <p className="mt-2 text-lg font-semibold text-ink">{streakDays} 天</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <TrendingUp className="h-4 w-4 text-sky-600" />
              今日完成进度
            </div>
            <p className="mt-2 text-lg font-semibold text-ink">{todayProgress}%</p>
          </div>
          <div className="rounded-2xl border border-slate-200/70 bg-white/75 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Target className="h-4 w-4 text-emerald-600" />
              本月目标
            </div>
            <p className="mt-2 text-lg font-semibold text-ink">{monthlyGoal} 天</p>
          </div>
        </div>
      </div>

      <nav className="mt-5 flex flex-wrap gap-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={clsx(
              "rounded-full px-4 py-2 text-sm transition",
              currentPage === item.id
                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                : "bg-white/70 text-slate-600 hover:bg-white hover:text-ink",
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
