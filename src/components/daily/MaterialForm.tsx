import { DIFFICULTY_OPTIONS, MATERIAL_TYPE_OPTIONS, TOPIC_OPTIONS } from "../../constants/options";
import type { Material } from "../../types/study";
import { validateUrl } from "../../utils/study";
import { Select } from "../common/Select";

interface MaterialFormProps {
  material: Material;
  onChange: (material: Material) => void;
  onSave: () => void;
}

export function MaterialForm({ material, onChange, onSave }: MaterialFormProps) {
  const linkStatus = validateUrl(material.url);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="field-label">标题</label>
        <input className="field" value={material.title} onChange={(event) => onChange({ ...material, title: event.target.value })} />
      </div>

      <div className="md:col-span-2">
        <label className="field-label">链接</label>
        <input className="field" value={material.url} onChange={(event) => onChange({ ...material, url: event.target.value })} />
        {linkStatus === "invalid" ? <p className="mt-2 text-sm text-amber-600">链接格式可能不正确，但仍然可以保存。</p> : null}
      </div>

      <div>
        <label className="field-label">类型</label>
        <Select value={material.type} onChange={(value) => onChange({ ...material, type: value })} options={MATERIAL_TYPE_OPTIONS} />
      </div>

      <div>
        <label className="field-label">主题</label>
        <Select value={material.topic} onChange={(value) => onChange({ ...material, topic: value })} options={TOPIC_OPTIONS} />
      </div>

      <div>
        <label className="field-label">难度</label>
        <Select value={material.difficulty} onChange={(value) => onChange({ ...material, difficulty: value })} options={DIFFICULTY_OPTIONS} />
      </div>

      <div className="md:col-span-2">
        <label className="field-label">备注</label>
        <textarea
          className="field min-h-28"
          value={material.notes}
          onChange={(event) => onChange({ ...material, notes: event.target.value })}
        />
      </div>

      <div className="md:col-span-2">
        <button type="button" onClick={onSave} className="rounded-full bg-slate-900 px-5 py-2.5 text-sm text-white">
          保存材料
        </button>
      </div>
    </div>
  );
}
