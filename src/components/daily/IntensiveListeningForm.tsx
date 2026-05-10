import { Plus, Trash2 } from "lucide-react";
import type { IntensiveListeningRecord, VocabularyItem } from "../../types/study";
import { Slider } from "../common/Slider";

interface IntensiveListeningFormProps {
  value: IntensiveListeningRecord;
  onChange: (value: IntensiveListeningRecord) => void;
}

function createVocabularyItem(): VocabularyItem {
  return {
    text: "",
    meaning: "",
    example: "",
  };
}

export function IntensiveListeningForm({ value, onChange }: IntensiveListeningFormProps) {
  function updateVocabulary(index: number, nextItem: VocabularyItem) {
    onChange({
      ...value,
      vocabulary: value.vocabulary.map((item, currentIndex) => (currentIndex === index ? nextItem : item)),
    });
  }

  function addVocabulary() {
    if (value.vocabulary.length >= 5) {
      return;
    }

    onChange({
      ...value,
      vocabulary: [...value.vocabulary, createVocabularyItem()],
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="field-label">这段内容主要在讲什么？</label>
        <textarea className="field min-h-28" value={value.mainIdea} onChange={(event) => onChange({ ...value, mainIdea: event.target.value })} />
      </div>

      <div>
        <label className="field-label">说话人的核心观点是什么？</label>
        <textarea className="field min-h-24" value={value.speakerPoint} onChange={(event) => onChange({ ...value, speakerPoint: event.target.value })} />
      </div>

      <div>
        <label className="field-label">有没有没听懂的地方？</label>
        <textarea className="field min-h-24" value={value.unclearParts} onChange={(event) => onChange({ ...value, unclearParts: event.target.value })} />
      </div>

      <Slider
        value={value.comprehension}
        onChange={(comprehension) => onChange({ ...value, comprehension })}
        min={10}
        max={100}
        label="精听后听懂程度"
      />

      <div className="space-y-4 rounded-[28px] border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-ink">今日最多查 5 个词</h4>
            <p className="mt-1 text-sm text-slate-500">把真正会反复用到的词留下来。</p>
          </div>
          <button
            type="button"
            onClick={addVocabulary}
            disabled={value.vocabulary.length >= 5}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm text-slate-600 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            新增词汇
          </button>
        </div>

        {value.vocabulary.map((item, index) => (
          <div key={`vocabulary-${index + 1}`} className="rounded-[24px] border border-white/80 bg-white/90 p-4">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">词汇 {index + 1}</p>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    vocabulary: value.vocabulary.filter((_, currentIndex) => currentIndex !== index),
                  })
                }
                className="text-slate-400 transition hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <input className="field" placeholder="单词 / 短语" value={item.text} onChange={(event) => updateVocabulary(index, { ...item, text: event.target.value })} />
              <input className="field" placeholder="中文意思" value={item.meaning} onChange={(event) => updateVocabulary(index, { ...item, meaning: event.target.value })} />
              <input className="field" placeholder="我的例句" value={item.example} onChange={(event) => updateVocabulary(index, { ...item, example: event.target.value })} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
