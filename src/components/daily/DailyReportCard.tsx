import type { StudySession } from "../../types/study";
import { getEffectiveActualMinutes } from "../../utils/study";
import { Tag } from "../common/Tag";

interface DailyReportCardProps {
  session: StudySession;
}

export function DailyReportCard({ session }: DailyReportCardProps) {
  const sentenceCount = session.sentences.filter((sentence) => sentence.text.trim()).length;
  const actualMinutes = getEffectiveActualMinutes(session);

  return (
    <section className="panel-soft p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-xl font-semibold text-ink">今日报告</h3>
        <Tag tone="success">{session.isCompleted ? "已完成" : "进行中"}</Tag>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white/80 p-4">
          <p className="text-sm text-slate-500">今日练习总时长</p>
          <p className="mt-2 text-xl font-semibold text-ink">{actualMinutes} 分钟</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-4">
          <p className="text-sm text-slate-500">完成步骤数量</p>
          <p className="mt-2 text-xl font-semibold text-ink">{session.completedSteps.length}/10</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-4">
          <p className="text-sm text-slate-500">关键词数量</p>
          <p className="mt-2 text-xl font-semibold text-ink">{session.blindListening.keywords.length}</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-4">
          <p className="text-sm text-slate-500">收藏句子数量</p>
          <p className="mt-2 text-xl font-semibold text-ink">{sentenceCount}</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-4">
          <p className="text-sm text-slate-500">职场口语录音时长</p>
          <p className="mt-2 text-xl font-semibold text-ink">{session.workplaceSpeaking.duration} 秒</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-4">
          <p className="text-sm text-slate-500">雅思听力正确率</p>
          <p className="mt-2 text-xl font-semibold text-ink">{session.ieltsListening.accuracy}%</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-4">
          <p className="text-sm text-slate-500">雅思口语录音时长</p>
          <p className="mt-2 text-xl font-semibold text-ink">{session.ieltsSpeaking.duration} 秒</p>
        </div>
        <div className="rounded-2xl bg-white/80 p-4">
          <p className="text-sm text-slate-500">今日复盘摘要</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{session.review.biggestGain || "今天不需要完美，只需要完成闭环。"}</p>
        </div>
      </div>
    </section>
  );
}
