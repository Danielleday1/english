import { IELTS_LISTENING_ERROR_OPTIONS, IELTS_QUESTION_OPTIONS } from "../../constants/options";
import type { IELTSListeningRecord } from "../../types/study";
import { calculateAccuracy } from "../../utils/study";
import { Select } from "../common/Select";

interface IELTSListeningFormProps {
  value: IELTSListeningRecord;
  onChange: (value: IELTSListeningRecord) => void;
}

export function IELTSListeningForm({ value, onChange }: IELTSListeningFormProps) {
  const accuracy = calculateAccuracy(value.totalQuestions, value.correctAnswers);
  const invalidCorrect = value.totalQuestions > 0 && value.correctAnswers > value.totalQuestions;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="field-label">材料名称</label>
          <input className="field" value={value.materialName} onChange={(event) => onChange({ ...value, materialName: event.target.value, accuracy })} />
        </div>

        <div>
          <label className="field-label">Section</label>
          <Select
            value={value.section}
            onChange={(section) => onChange({ ...value, section, accuracy })}
            options={[
              { value: 1, label: "Section 1" },
              { value: 2, label: "Section 2" },
              { value: 3, label: "Section 3" },
              { value: 4, label: "Section 4" },
            ]}
          />
        </div>

        <div>
          <label className="field-label">题型</label>
          <Select value={value.questionType} onChange={(questionType) => onChange({ ...value, questionType, accuracy })} options={IELTS_QUESTION_OPTIONS} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">总题数</label>
            <input
              type="number"
              min={0}
              className="field"
              value={value.totalQuestions}
              onChange={(event) => {
                const totalQuestions = Number(event.target.value);
                onChange({
                  ...value,
                  totalQuestions,
                  accuracy: calculateAccuracy(totalQuestions, value.correctAnswers),
                });
              }}
            />
          </div>
          <div>
            <label className="field-label">答对题数</label>
            <input
              type="number"
              min={0}
              className="field"
              value={value.correctAnswers}
              onChange={(event) => {
                const correctAnswers = Number(event.target.value);
                onChange({
                  ...value,
                  correctAnswers,
                  accuracy: calculateAccuracy(value.totalQuestions, correctAnswers),
                });
              }}
            />
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
        <p className="text-sm text-slate-500">自动计算正确率</p>
        <p className="mt-2 text-2xl font-semibold text-ink">{accuracy}%</p>
        {invalidCorrect ? <p className="mt-2 text-sm text-amber-600">答对题数不能大于总题数。</p> : null}
      </div>

      <div>
        <label className="field-label">错误原因</label>
        <div className="grid gap-3 md:grid-cols-2">
          {IELTS_LISTENING_ERROR_OPTIONS.map((reason) => {
            const checked = value.errorReasons.includes(reason);
            return (
              <label key={reason} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() =>
                    onChange({
                      ...value,
                      accuracy,
                      errorReasons: checked ? value.errorReasons.filter((item) => item !== reason) : [...value.errorReasons, reason],
                    })
                  }
                />
                {reason}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label className="field-label">错题笔记</label>
        <textarea className="field min-h-24" value={value.notes} onChange={(event) => onChange({ ...value, notes: event.target.value, accuracy })} />
      </div>

      <div>
        <label className="field-label">下次注意事项</label>
        <textarea className="field min-h-24" value={value.nextFocus} onChange={(event) => onChange({ ...value, nextFocus: event.target.value, accuracy })} />
      </div>
    </div>
  );
}
