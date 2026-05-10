import clsx from "clsx";
import type { ReactNode } from "react";
import { CheckCircle2, ChevronDown } from "lucide-react";

interface StepCardProps {
  title: string;
  description: string;
  isOpen: boolean;
  isCompleted: boolean;
  stepIndex: number;
  plannedMinutes: number;
  onToggle: () => void;
  children: ReactNode;
}

export function StepCard({
  title,
  description,
  isOpen,
  isCompleted,
  stepIndex,
  plannedMinutes,
  onToggle,
  children,
}: StepCardProps) {
  return (
    <article
      className={clsx(
        "animate-fade-up overflow-hidden rounded-[28px] border bg-white/82 shadow-soft backdrop-blur-xl transition",
        isCompleted ? "border-emerald-200/80" : "border-white/80",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
      >
        <div className="flex items-start gap-4">
          <div
            className={clsx(
              "mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-semibold",
              isCompleted ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500",
            )}
          >
            {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : stepIndex}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold text-ink">{title}</h3>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">{plannedMinutes} 分钟</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        <ChevronDown className={clsx("h-5 w-5 text-slate-400 transition", isOpen ? "rotate-180" : "rotate-0")} />
      </button>
      {isOpen ? <div className="border-t border-slate-100 px-5 py-5 sm:px-6">{children}</div> : null}
    </article>
  );
}
