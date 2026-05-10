import type { IELTSSpeakingRecord } from "../../types/study";
import { AudioRecorder } from "./AudioRecorder";
import { Timer } from "../common/Timer";
import { Select } from "../common/Select";

interface IELTSSpeakingFormProps {
  sessionId: string;
  value: IELTSSpeakingRecord;
  onChange: (value: IELTSSpeakingRecord) => void;
}

function getPrepareSeconds(part: 1 | 2 | 3): number {
  if (part === 2) {
    return 60;
  }

  return part === 1 ? 15 : 30;
}

export function IELTSSpeakingForm({ sessionId, value, onChange }: IELTSSpeakingFormProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="field-label">Part</label>
              <Select
                value={value.part}
                onChange={(part) => onChange({ ...value, part })}
                options={[
                  { value: 1, label: "Part 1" },
                  { value: 2, label: "Part 2" },
                  { value: 3, label: "Part 3" },
                ]}
              />
            </div>
            <div>
              <label className="field-label">今日题目</label>
              <input className="field" value={value.prompt} onChange={(event) => onChange({ ...value, prompt: event.target.value })} />
            </div>
          </div>

          <AudioRecorder
            sessionId={sessionId}
            recordingType="ielts"
            recordingId={value.recordingId}
            onSaved={(recordingId, duration) => onChange({ ...value, recordingId, duration })}
            onDeleted={() => onChange({ ...value, recordingId: undefined, duration: 0 })}
          />

          <div>
            <label className="field-label">回答文本</label>
            <textarea className="field min-h-28" value={value.transcript} onChange={(event) => onChange({ ...value, transcript: event.target.value })} />
          </div>
        </div>

        <Timer seconds={getPrepareSeconds(value.part)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label className="field-label">Fluency &amp; Coherence</label>
          <input
            type="range"
            min={1}
            max={5}
            value={value.scores.fluencyCoherence}
            onChange={(event) =>
              onChange({
                ...value,
                scores: { ...value.scores, fluencyCoherence: Number(event.target.value) },
              })
            }
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-800"
          />
          <p className="mt-2 text-sm text-slate-400">{value.scores.fluencyCoherence}/5</p>
        </div>
        <div>
          <label className="field-label">Lexical Resource</label>
          <input
            type="range"
            min={1}
            max={5}
            value={value.scores.lexicalResource}
            onChange={(event) =>
              onChange({
                ...value,
                scores: { ...value.scores, lexicalResource: Number(event.target.value) },
              })
            }
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-800"
          />
          <p className="mt-2 text-sm text-slate-400">{value.scores.lexicalResource}/5</p>
        </div>
        <div>
          <label className="field-label">Grammar Range &amp; Accuracy</label>
          <input
            type="range"
            min={1}
            max={5}
            value={value.scores.grammarRangeAccuracy}
            onChange={(event) =>
              onChange({
                ...value,
                scores: { ...value.scores, grammarRangeAccuracy: Number(event.target.value) },
              })
            }
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-800"
          />
          <p className="mt-2 text-sm text-slate-400">{value.scores.grammarRangeAccuracy}/5</p>
        </div>
        <div>
          <label className="field-label">Pronunciation</label>
          <input
            type="range"
            min={1}
            max={5}
            value={value.scores.pronunciation}
            onChange={(event) =>
              onChange({
                ...value,
                scores: { ...value.scores, pronunciation: Number(event.target.value) },
              })
            }
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-800"
          />
          <p className="mt-2 text-sm text-slate-400">{value.scores.pronunciation}/5</p>
        </div>
      </div>

      <div>
        <label className="field-label">今日问题</label>
        <textarea className="field min-h-24" value={value.problems} onChange={(event) => onChange({ ...value, problems: event.target.value })} />
      </div>

      <div>
        <label className="field-label">下次改进方向</label>
        <textarea className="field min-h-24" value={value.improvement} onChange={(event) => onChange({ ...value, improvement: event.target.value })} />
      </div>
    </div>
  );
}
