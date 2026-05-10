import type { Sentence, ShadowingRecord } from "../../types/study";
import { EmptyState } from "../common/EmptyState";
import { Select } from "../common/Select";
import { MASTERY_OPTIONS } from "../../constants/options";
import { Tag } from "../common/Tag";

interface ShadowingTrackerProps {
  sentences: Sentence[];
  shadowing: ShadowingRecord[];
  onChange: (records: ShadowingRecord[]) => void;
}

export function ShadowingTracker({ sentences, shadowing, onChange }: ShadowingTrackerProps) {
  const activeSentences = sentences.filter((sentence) => sentence.text.trim());

  if (activeSentences.length === 0) {
    return <EmptyState title="还没有可跟读的句子" description="先在上一步留下今天真正想带走的 3 句表达。" />;
  }

  function updateRecord(sentenceId: string, updater: (record: ShadowingRecord) => ShadowingRecord) {
    onChange(
      shadowing.map((record) => (record.sentenceId === sentenceId ? updater(record) : record)),
    );
  }

  return (
    <div className="space-y-4">
      {activeSentences.map((sentence) => {
        const record = shadowing.find((item) => item.sentenceId === sentence.id) ?? {
          sentenceId: sentence.id,
          repeatCount: 0,
          mastery: sentence.mastery,
        };
        const completed = record.repeatCount >= 5;

        return (
          <div key={sentence.id} className={`rounded-[28px] border p-5 ${completed ? "border-emerald-200 bg-emerald-50/70" : "border-slate-200 bg-white/85"}`}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-base font-semibold text-ink">{sentence.text}</h4>
                  {completed ? <Tag tone="success">完成 5 次</Tag> : <Tag>{record.repeatCount}/5 次</Tag>}
                </div>
                <p className="text-sm text-slate-500">{sentence.translation}</p>
              </div>

              <div className="w-full max-w-xs">
                <label className="field-label">掌握程度</label>
                <Select
                  value={record.mastery}
                  onChange={(mastery) => updateRecord(sentence.id, (current) => ({ ...current, mastery }))}
                  options={MASTERY_OPTIONS}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => updateRecord(sentence.id, (current) => ({ ...current, repeatCount: Math.min(current.repeatCount + 1, 5) }))}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white"
              >
                加一次
              </button>
              <button
                type="button"
                onClick={() => updateRecord(sentence.id, (current) => ({ ...current, repeatCount: 0 }))}
                className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600"
              >
                重置
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
