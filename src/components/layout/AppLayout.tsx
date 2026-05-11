import type { ReactNode } from "react";
import { APP_TITLE } from "../../constants/options";
import type { DashboardStats } from "../../types/study";
import { CloudSyncModal } from "./CloudSyncModal";
import { TopNav, type AppPage, type CloudEntryStatus } from "./TopNav";

interface AppLayoutProps {
  children: ReactNode;
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onOpenCloudSync: () => void;
  onCloseCloudSync: () => void;
  stats: DashboardStats;
  todayProgress: number;
  cloudLabel: string;
  cloudStatus: CloudEntryStatus;
  cloudSyncOpen: boolean;
}

export function AppLayout({
  children,
  currentPage,
  onNavigate,
  onOpenCloudSync,
  onCloseCloudSync,
  stats,
  todayProgress,
  cloudLabel,
  cloudStatus,
  cloudSyncOpen,
}: AppLayoutProps) {
  return (
    <div className="min-h-screen px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-7xl flex-col gap-5 rounded-[36px] border border-white/60 bg-white/30 p-4 shadow-soft backdrop-blur-2xl sm:p-6">
        <TopNav
          appTitle={APP_TITLE}
          currentPage={currentPage}
          onNavigate={onNavigate}
          onOpenCloudSync={onOpenCloudSync}
          streakDays={stats.streakDays}
          todayProgress={todayProgress}
          monthlyGoal={30}
          cloudLabel={cloudLabel}
          cloudStatus={cloudStatus}
        />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 pb-8">{children}</main>
      </div>
      <CloudSyncModal open={cloudSyncOpen} onClose={onCloseCloudSync} />
    </div>
  );
}
