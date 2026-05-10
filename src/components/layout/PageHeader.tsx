import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <section className="animate-fade-up rounded-[30px] border border-white/70 bg-gradient-to-br from-white/90 via-white/75 to-slate-50/60 px-5 py-6 shadow-soft backdrop-blur-xl sm:px-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-2">
          {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.28em] text-slate-400">{eyebrow}</p> : null}
          <h2 className="text-3xl font-semibold text-ink sm:text-4xl">{title}</h2>
          <p className="max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
