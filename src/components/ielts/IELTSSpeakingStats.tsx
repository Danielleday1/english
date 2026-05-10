import type { StudySession } from "../../types/study";
import { EmptyState } from "../common/EmptyState";
import { StatCard } from "../common/StatCard";

interface IELTSSpeakingStatsProps {
  sessions: StudySession[];
}

export function IELTSSpeakingStats({ sessions }: IELTSSpeakingStatsProps) {
  const speakingSessions = sessions.filter((session) => session.ieltsSpeaking.recordingId || session.ieltsSpeaking.transcript.trim());
  if (speakingSessions.length === 0) {
    return <EmptyState title="还没有雅思记录" description="先完成一次 Section 或一次口语录音。" />;
  }

  const currentMonth = new Date().getMonth();
  const monthSessions = speakingSessions.filter((session) => new Date(session.updatedAt).getMonth() === currentMonth);
  const totalDuration = speakingSessions.reduce((sum, session) => sum + session.ieltsSpeaking.duration, 0);

  function averageScore(selector: (session: StudySession) => number): number {
    return Number(
      (
        speakingSessions.reduce((sum, session) => sum + selector(session), 0) /
        (speakingSessions.length || 1)
      ).toFixed(1),
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard label="本月练习次数" value={`${monthSessions.length}`} />
      <StatCard label="Part 1 次数" value={`${speakingSessions.filter((session) => session.ieltsSpeaking.part === 1).length}`} />
      <StatCard label="Part 2 次数" value={`${speakingSessions.filter((session) => session.ieltsSpeaking.part === 2).length}`} />
      <StatCard label="Part 3 次数" value={`${speakingSessions.filter((session) => session.ieltsSpeaking.part === 3).length}`} />
      <StatCard label="累计口语输出时长" value={`${totalDuration} 秒`} />
      <StatCard label="Fluency 平均分" value={`${averageScore((session) => session.ieltsSpeaking.scores.fluencyCoherence)}`} />
      <StatCard label="Lexical 平均分" value={`${averageScore((session) => session.ieltsSpeaking.scores.lexicalResource)}`} />
      <StatCard label="Grammar / Pronunciation" value={`${averageScore((session) => (session.ieltsSpeaking.scores.grammarRangeAccuracy + session.ieltsSpeaking.scores.pronunciation) / 2)}`} />
    </div>
  );
}
