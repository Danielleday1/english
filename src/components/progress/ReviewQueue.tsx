import { useAppContext } from "../../context/AppContext";
import type { ReviewQueueData } from "../../types/study";
import { EmptyState } from "../common/EmptyState";
import { Tag } from "../common/Tag";

interface ReviewQueueProps {
  queue: ReviewQueueData;
}

export function ReviewQueue({ queue }: ReviewQueueProps) {
  const { reviewSentence } = useAppContext();
  const hasAnyQueue =
    queue.recentSentences.length > 0 ||
    queue.weakSentences.length > 0 ||
    queue.topErrorReasons.length > 0 ||
    Boolean(queue.lastSpeakingImprovement);

  if (!hasAnyQueue) {
    return <EmptyState title="还没有复习内容" description="先完成几次练习，这里会自动帮你整理下一轮复习重点。" />;
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <section className="panel-soft p-5">
        <h3 className="text-lg font-semibold text-ink">最近 7 天收藏的句子</h3>
        <div className="mt-4 space-y-3">
          {queue.recentSentences.map((sentence) => (
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
          ))}
        </div>
      </section>

      <section className="panel-soft p-5">
        <h3 className="text-lg font-semibold text-ink">掌握程度为“生疏”的句子</h3>
        <div className="mt-4 space-y-3">
          {queue.weakSentences.map((sentence) => (
            <div key={sentence.id} className="rounded-2xl bg-white/80 p-4">
              <p className="font-medium text-ink">{sentence.text}</p>
              <p className="mt-2 text-sm text-slate-500">{sentence.scenario || "还没有记录使用场景"}</p>
              <button
                type="button"
                onClick={() => reviewSentence(sentence.id)}
                className="mt-3 rounded-full bg-emerald-500 px-4 py-2 text-sm text-white"
              >
                复习一次
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-soft p-5">
        <h3 className="text-lg font-semibold text-ink">雅思听力高频错因</h3>
        <div className="mt-4 space-y-3">
          {queue.topErrorReasons.map((reason) => (
            <div key={reason.reason} className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-600">
              <span>{reason.reason}</span>
              <span>{reason.count} 次</span>
            </div>
          ))}
        </div>
      </section>

      <section className="panel-soft p-5">
        <h3 className="text-lg font-semibold text-ink">最近一次雅思口语改进方向</h3>
        <div className="mt-4 rounded-2xl bg-white/80 p-4 text-sm leading-7 text-slate-600">
          {queue.lastSpeakingImprovement || "还没有记录。"}
        </div>
      </section>
    </div>
  );
}
