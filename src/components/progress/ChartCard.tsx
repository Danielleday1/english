import type { ReactNode } from "react";
import { EmptyState } from "../common/EmptyState";

interface ChartCardProps {
  title: string;
  description: string;
  hasData: boolean;
  children: ReactNode;
}

export function ChartCard({ title, description, hasData, children }: ChartCardProps) {
  return (
    <section className="panel-soft p-5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-sm leading-7 text-slate-500">{description}</p>
      </div>
      {hasData ? children : <EmptyState title="没有图表数据" description="练习几天后，这里会开始出现你的进步曲线。" />}
    </section>
  );
}
