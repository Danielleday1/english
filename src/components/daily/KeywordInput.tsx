import type { BlindListeningRecord } from "../../types/study";
import { normalizeKeywords } from "../../utils/study";
import { Slider } from "../common/Slider";

interface KeywordInputProps {
  value: BlindListeningRecord;
  onChange: (value: BlindListeningRecord) => void;
}

export function KeywordInput({ value, onChange }: KeywordInputProps) {
  const keywordText = value.keywords.join(", ");

  return (
    <div className="space-y-5">
      <div>
        <label className="field-label">关键词（逗号分隔）</label>
        <textarea
          className="field min-h-28"
          value={keywordText}
          onChange={(event) => onChange({ ...value, keywords: normalizeKeywords(event.target.value) })}
          placeholder="例如：launch, roadmap, feedback loop"
        />
        <p className="mt-2 text-sm text-slate-400">已记录 {value.keywords.length} 个关键词</p>
      </div>

      <Slider
        value={value.comprehension}
        onChange={(comprehension) => onChange({ ...value, comprehension })}
        min={10}
        max={100}
        label="盲听听懂程度"
      />

      <div>
        <label className="field-label">盲听备注</label>
        <textarea
          className="field min-h-28"
          value={value.notes}
          onChange={(event) => onChange({ ...value, notes: event.target.value })}
        />
      </div>
    </div>
  );
}
