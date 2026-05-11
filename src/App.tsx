import { useEffect, useState } from "react";
import { AppLayout } from "./components/layout/AppLayout";
import type { AppPage } from "./components/layout/TopNav";
import { AppProvider, useAppContext } from "./context/AppContext";
import {
  calculateDashboardStats,
  getErrorReasonStats,
  getRecentCompletedSession,
  getReviewQueue,
  getTrendData,
  getWeeklyReviewData,
} from "./storage/statistics";
import { DashboardPage } from "./pages/DashboardPage";
import { DailyPracticePage } from "./pages/DailyPracticePage";
import { IELTSPage } from "./pages/IELTSPage";
import { ProgressPage } from "./pages/ProgressPage";
import { WorkplacePage } from "./pages/WorkplacePage";
import { calculateSessionProgress } from "./utils/study";

function getPageFromHash(): AppPage {
  const hash = window.location.hash.replace("#", "");
  if (hash === "daily" || hash === "workplace" || hash === "ielts" || hash === "progress") {
    return hash;
  }
  return "dashboard";
}

function AppShell() {
  const { data, todaySession, cloudSync, setTodaySession, syncSessionSentences } = useAppContext();
  const [currentPage, setCurrentPage] = useState<AppPage>(getPageFromHash());
  const [cloudSyncOpen, setCloudSyncOpen] = useState(false);

  useEffect(() => {
    const handleHashChange = () => setCurrentPage(getPageFromHash());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  function navigate(page: AppPage) {
    window.location.hash = page === "dashboard" ? "" : page;
    setCurrentPage(page);
  }

  const stats = calculateDashboardStats(data);
  const trends = getTrendData(data.sessions);
  const errorReasons = getErrorReasonStats(data.sessions);
  const reviewQueue = getReviewQueue(data);
  const weeklyReview = getWeeklyReviewData(data);
  const recentSession = getRecentCompletedSession(data.sessions);
  const todayProgress = calculateSessionProgress(todaySession);
  const cloudLabel = !cloudSync.isConfigured
    ? "Local Only"
    : cloudSync.isSignedIn
      ? "Cloud Connected"
      : "Cloud Available";
  const cloudStatus = !cloudSync.isConfigured ? "local_only" : cloudSync.isSignedIn ? "connected" : "available";

  return (
    <AppLayout
      currentPage={currentPage}
      onNavigate={navigate}
      onOpenCloudSync={() => setCloudSyncOpen(true)}
      onCloseCloudSync={() => setCloudSyncOpen(false)}
      stats={stats}
      todayProgress={todayProgress}
      cloudLabel={cloudLabel}
      cloudStatus={cloudStatus}
      cloudSyncOpen={cloudSyncOpen}
    >
      {currentPage === "dashboard" ? (
        <DashboardPage stats={stats} todaySession={todaySession} recentSession={recentSession} onStart={() => navigate("daily")} />
      ) : null}

      {currentPage === "daily" ? (
        <DailyPracticePage
          session={todaySession}
          onSessionChange={setTodaySession}
          onComplete={setTodaySession}
          onSyncSentences={syncSessionSentences}
        />
      ) : null}

      {currentPage === "workplace" ? (
        <WorkplacePage
          sessions={data.sessions}
          onUsePrompt={(prompt) => {
            setTodaySession({
              ...todaySession,
              workplaceSpeaking: {
                ...todaySession.workplaceSpeaking,
                prompt,
              },
            });
            navigate("daily");
          }}
        />
      ) : null}

      {currentPage === "ielts" ? <IELTSPage sessions={data.sessions} /> : null}

      {currentPage === "progress" ? (
        <ProgressPage stats={stats} trends={trends} errorReasons={errorReasons} reviewQueue={reviewQueue} weeklyReview={weeklyReview} />
      ) : null}
    </AppLayout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
