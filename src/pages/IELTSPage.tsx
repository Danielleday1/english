import { useState } from "react";
import { PageHeader } from "../components/layout/PageHeader";
import { IELTSListeningList } from "../components/ielts/IELTSListeningList";
import { IELTSListeningStats } from "../components/ielts/IELTSListeningStats";
import { IELTSSpeakingList } from "../components/ielts/IELTSSpeakingList";
import { IELTSSpeakingStats } from "../components/ielts/IELTSSpeakingStats";
import type { StudySession } from "../types/study";

interface IELTSPageProps {
  sessions: StudySession[];
}

export function IELTSPage({ sessions }: IELTSPageProps) {
  const [tab, setTab] = useState<"listening" | "speaking">("listening");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="IELTS Training"
        title="把雅思训练记录成一条清楚的进步线"
        description="这里保留听力正确率、错因和口语自评，你能很快看到自己到底卡在哪里。"
      />

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setTab("listening")} className={`rounded-full px-4 py-2 text-sm ${tab === "listening" ? "bg-slate-900 text-white" : "bg-white text-slate-500"}`}>
          IELTS Listening
        </button>
        <button type="button" onClick={() => setTab("speaking")} className={`rounded-full px-4 py-2 text-sm ${tab === "speaking" ? "bg-slate-900 text-white" : "bg-white text-slate-500"}`}>
          IELTS Speaking
        </button>
      </div>

      {tab === "listening" ? (
        <div className="space-y-6">
          <IELTSListeningStats sessions={sessions} />
          <IELTSListeningList sessions={sessions} />
        </div>
      ) : (
        <div className="space-y-6">
          <IELTSSpeakingStats sessions={sessions} />
          <IELTSSpeakingList sessions={sessions} />
        </div>
      )}
    </div>
  );
}
