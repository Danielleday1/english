import { WARMUP_MOOD_OPTIONS } from "../../constants/options";
import type { WarmupRecord } from "../../types/study";
import { Select } from "../common/Select";
import { Timer } from "../common/Timer";

interface WarmupStepProps {
  value: WarmupRecord;
  onChange: (value: WarmupRecord) => void;
  onComplete: () => void;
}

export function WarmupStep({ value, onChange, onComplete }: WarmupStepProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4 rounded-[28px] border border-slate-200 bg-white/80 p-5">
        <p className="text-sm leading-7 text-slate-500">
          Today I want to practice my English speaking and listening.
          <br />
          I don&apos;t need to be perfect.
          <br />
          I just need to speak clearly and keep going.
          <br />
          Today I will focus on one short clip.
        </p>

        <div>
          <label className="field-label">今天状态</label>
          <Select value={value.mood} onChange={(mood) => onChange({ ...value, mood })} options={WARMUP_MOOD_OPTIONS} />
        </div>

        <button
          type="button"
          onClick={() => {
            onChange({ ...value, completed: true });
            onComplete();
          }}
          className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm text-white"
        >
          完成热身
        </button>
      </div>

      <Timer seconds={5 * 60} />
    </div>
  );
}
