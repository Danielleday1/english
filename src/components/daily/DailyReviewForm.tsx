import { REVIEW_MOOD_OPTIONS } from "../../constants/options";
import type { DailyReview } from "../../types/study";
import { Select } from "../common/Select";

interface DailyReviewFormProps {
  review: DailyReview;
  actualMinutes: number;
  completionRate: number;
  onReviewChange: (value: DailyReview) => void;
  onActualMinutesChange: (value: number) => void;
}

export function DailyReviewForm({
  review,
  actualMinutes,
  completionRate,
  onReviewChange,
  onActualMinutesChange,
}: DailyReviewFormProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="field-label">今日最大收获</label>
          <textarea className="field min-h-24" value={review.biggestGain} onChange={(event) => onReviewChange({ ...review, biggestGain: event.target.value })} />
        </div>
        <div>
          <label className="field-label">今日最大问题</label>
          <textarea className="field min-h-24" value={review.biggestProblem} onChange={(event) => onReviewChange({ ...review, biggestProblem: event.target.value })} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="field-label">明天要复习什么</label>
          <textarea className="field min-h-24" value={review.tomorrowReview} onChange={(event) => onReviewChange({ ...review, tomorrowReview: event.target.value })} />
        </div>
        <div className="space-y-4">
          <div>
            <label className="field-label">今日心情</label>
            <Select value={review.mood} onChange={(mood) => onReviewChange({ ...review, mood })} options={REVIEW_MOOD_OPTIONS} />
          </div>
          <div>
            <label className="field-label">今日实际练习分钟数</label>
            <input
              type="number"
              min={0}
              className="field"
              value={actualMinutes}
              onChange={(event) => onActualMinutesChange(Number(event.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-4">
        <p className="text-sm text-slate-500">今日完成度自动计算</p>
        <p className="mt-2 text-2xl font-semibold text-ink">{completionRate}%</p>
      </div>
    </div>
  );
}
