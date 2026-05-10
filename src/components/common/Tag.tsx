import clsx from "clsx";
import type { ReactNode } from "react";

interface TagProps {
  children: ReactNode;
  tone?: "neutral" | "success" | "info";
}

export function Tag({ children, tone = "neutral" }: TagProps) {
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        tone === "success"
          ? "bg-emerald-50 text-emerald-700"
          : tone === "info"
            ? "bg-sky-50 text-sky-700"
            : "bg-slate-100 text-slate-600",
      )}
    >
      {children}
    </span>
  );
}
