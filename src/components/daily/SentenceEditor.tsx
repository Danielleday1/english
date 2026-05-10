import type { Sentence } from "../../types/study";
import { MASTERY_OPTIONS, SENTENCE_TAG_OPTIONS } from "../../constants/options";
import { Select } from "../common/Select";

interface SentenceEditorProps {
  sentences: Sentence[];
  onChange: (sentences: Sentence[]) => void;
  onSave: () => void;
}

export function SentenceEditor({ sentences, onChange, onSave }: SentenceEditorProps) {
  function updateSentence(index: number, nextSentence: Sentence) {
    onChange(sentences.map((sentence, currentIndex) => (currentIndex === index ? nextSentence : sentence)));
  }

  return (
    <div className="space-y-5">
      {sentences.map((sentence, index) => (
        <div key={sentence.id} className="rounded-[28px] border border-slate-200 bg-white/85 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-base font-semibold text-ink">句子 {index + 1}</h4>
            <span className="text-sm text-slate-400">把这句话加入你的职场英文弹药库。</span>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="field-label">英文句子</label>
              <textarea className="field min-h-24" value={sentence.text} onChange={(event) => updateSentence(index, { ...sentence, text: event.target.value })} />
            </div>

            <div className="md:col-span-2">
              <label className="field-label">中文意思</label>
              <textarea className="field min-h-20" value={sentence.translation} onChange={(event) => updateSentence(index, { ...sentence, translation: event.target.value })} />
            </div>

            <div>
              <label className="field-label">使用场景</label>
              <input className="field" value={sentence.scenario} onChange={(event) => updateSentence(index, { ...sentence, scenario: event.target.value })} />
            </div>

            <div>
              <label className="field-label">标签</label>
              <Select value={sentence.tag} onChange={(tag) => updateSentence(index, { ...sentence, tag })} options={SENTENCE_TAG_OPTIONS} />
            </div>

            <div>
              <label className="field-label">掌握程度</label>
              <Select value={sentence.mastery} onChange={(mastery) => updateSentence(index, { ...sentence, mastery })} options={MASTERY_OPTIONS} />
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={onSave} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm text-white">
        保存到句型库
      </button>
    </div>
  );
}
