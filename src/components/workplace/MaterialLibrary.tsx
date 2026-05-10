import { useState } from "react";
import { TOPIC_OPTIONS } from "../../constants/options";
import type { StudySession, TopicType } from "../../types/study";
import { EmptyState } from "../common/EmptyState";
import { Tag } from "../common/Tag";

interface MaterialLibraryProps {
  sessions: StudySession[];
}

export function MaterialLibrary({ sessions }: MaterialLibraryProps) {
  const [topic, setTopic] = useState<TopicType | "">("");
  const materials = sessions.filter((session) => session.material.title.trim() && session.material.topic !== "ielts");
  const filtered = topic ? materials.filter((session) => session.material.topic === topic) : materials;

  if (materials.length === 0) {
    return <EmptyState title="还没有练习记录" description="今天就从第一段 1 分钟英文开始。" />;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setTopic("")} className={`rounded-full px-3 py-2 text-sm ${topic === "" ? "bg-slate-900 text-white" : "bg-white text-slate-500"}`}>
          全部
        </button>
        {TOPIC_OPTIONS.filter((option) => option.value !== "ielts").map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setTopic(option.value)}
            className={`rounded-full px-3 py-2 text-sm ${topic === option.value ? "bg-slate-900 text-white" : "bg-white text-slate-500"}`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filtered.map((session) => (
          <article key={session.id} className="panel-soft p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-ink">{session.material.title}</h3>
                <a href={session.material.url} target="_blank" rel="noreferrer" className="mt-2 block text-sm text-sky-700 underline-offset-4 hover:underline">
                  {session.material.url || "未填写链接"}
                </a>
              </div>
              <div className="flex flex-wrap gap-2">
                <Tag>{TOPIC_OPTIONS.find((option) => option.value === session.material.topic)?.label ?? session.material.topic}</Tag>
                <Tag tone={session.isCompleted ? "success" : "neutral"}>{session.isCompleted ? "已复习" : "未复习"}</Tag>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-5">
              <div>
                <p className="text-sm text-slate-400">练习日期</p>
                <p className="mt-1 text-sm text-slate-600">{session.date}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">难度</p>
                <p className="mt-1 text-sm text-slate-600">{session.material.difficulty}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">盲听听懂程度</p>
                <p className="mt-1 text-sm text-slate-600">{session.blindListening.comprehension}%</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">精听听懂程度</p>
                <p className="mt-1 text-sm text-slate-600">{session.intensiveListening.comprehension}%</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">备注</p>
                <p className="mt-1 text-sm text-slate-600">{session.material.notes || "还没有备注"}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
