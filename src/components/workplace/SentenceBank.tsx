import { useState } from "react";
import { Search } from "lucide-react";
import { MASTERY_OPTIONS, SENTENCE_TAG_OPTIONS } from "../../constants/options";
import { useAppContext } from "../../context/AppContext";
import { getSentenceBankByFilters } from "../../storage/statistics";
import { ConfirmDialog } from "../common/ConfirmDialog";
import { EmptyState } from "../common/EmptyState";
import { Select } from "../common/Select";
import { Tag } from "../common/Tag";

export function SentenceBank() {
  const { data, deleteSentence, reviewSentence, updateSentence } = useAppContext();
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [mastery, setMastery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const filtered = getSentenceBankByFilters(data.sentenceBank, search, tag, mastery);
  const editingSentence = data.sentenceBank.find((sentence) => sentence.id === editingId);

  if (data.sentenceBank.length === 0) {
    return <EmptyState title="你的职场英文弹药库还空着" description="今天先收藏 3 句真正会用到的话。" />;
  }

  return (
    <section className="space-y-4">
      <div className="panel-soft flex flex-col gap-4 p-5 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="field pl-10" placeholder="搜索句子 / 翻译 / 场景" value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:w-[380px]">
          <Select
            value={tag}
            onChange={(value) => setTag(value)}
            options={[{ value: "", label: "全部标签" }, ...SENTENCE_TAG_OPTIONS]}
          />
          <Select
            value={mastery}
            onChange={(value) => setMastery(value)}
            options={[{ value: "", label: "全部掌握程度" }, ...MASTERY_OPTIONS]}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filtered.map((sentence) => (
          <article key={sentence.id} className="panel-soft p-5">
            {editingId === sentence.id ? (
              <div className="space-y-4">
                <textarea className="field min-h-24" value={editingSentence?.text ?? ""} onChange={(event) => editingSentence && updateSentence({ ...editingSentence, text: event.target.value })} />
                <textarea className="field min-h-20" value={editingSentence?.translation ?? ""} onChange={(event) => editingSentence && updateSentence({ ...editingSentence, translation: event.target.value })} />
                <input className="field" value={editingSentence?.scenario ?? ""} onChange={(event) => editingSentence && updateSentence({ ...editingSentence, scenario: event.target.value })} />
                <div className="grid gap-4 md:grid-cols-2">
                  <Select value={editingSentence?.tag ?? "product"} onChange={(value) => editingSentence && updateSentence({ ...editingSentence, tag: value })} options={SENTENCE_TAG_OPTIONS} />
                  <Select value={editingSentence?.mastery ?? "weak"} onChange={(value) => editingSentence && updateSentence({ ...editingSentence, mastery: value })} options={MASTERY_OPTIONS} />
                </div>
                <button type="button" onClick={() => setEditingId(null)} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
                  完成编辑
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-ink">{sentence.text}</h3>
                      <Tag tone="info">{SENTENCE_TAG_OPTIONS.find((option) => option.value === sentence.tag)?.label}</Tag>
                      <Tag>{MASTERY_OPTIONS.find((option) => option.value === sentence.mastery)?.label}</Tag>
                    </div>
                    <p className="text-sm text-slate-500">{sentence.translation}</p>
                    <p className="text-sm text-slate-400">使用场景：{sentence.scenario || "还没有记录场景"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => reviewSentence(sentence.id)} className="rounded-full bg-emerald-500 px-4 py-2 text-sm text-white">
                      复习一次
                    </button>
                    <button type="button" onClick={() => setEditingId(sentence.id)} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                      编辑
                    </button>
                    <button type="button" onClick={() => setPendingDeleteId(sentence.id)} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
                      删除
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-slate-400">复习次数</p>
                    <p className="mt-1 text-sm text-slate-600">{sentence.reviewCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">最近复习日期</p>
                    <p className="mt-1 text-sm text-slate-600">{sentence.lastReviewedAt?.slice(0, 10) || "还没有复习"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">来源日期</p>
                    <p className="mt-1 text-sm text-slate-600">{sentence.createdAt.slice(0, 10)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">来源 Session</p>
                    <p className="mt-1 text-sm text-slate-600">{sentence.sessionId}</p>
                  </div>
                </div>
              </>
            )}
          </article>
        ))}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="删除这条句子？"
        description="删除后会同时从句型库和对应 session 中移除。"
        confirmLabel="确认删除"
        onConfirm={() => {
          if (pendingDeleteId) {
            deleteSentence(pendingDeleteId);
          }
          setPendingDeleteId(null);
        }}
        onCancel={() => setPendingDeleteId(null)}
      />
    </section>
  );
}
