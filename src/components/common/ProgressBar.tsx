import clsx from "clsx";

interface ProgressBarProps {
  value: number;
  label?: string;
  tone?: "default" | "success";
}

export function ProgressBar({ value, label, tone = "default" }: ProgressBarProps) {
  const safeValue = Math.min(Math.max(value, 0), 100);

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>{label}</span>
          <span>{safeValue}%</span>
        </div>
      ) : null}
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200/80">
        <div
          className={clsx(
            "h-full rounded-full transition-all duration-500",
            tone === "success" ? "bg-gradient-to-r from-emerald-400 to-emerald-500" : "bg-gradient-to-r from-slate-500 to-sky-500",
          )}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
