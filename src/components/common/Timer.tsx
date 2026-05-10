import { useEffect, useState } from "react";
import clsx from "clsx";

interface TimerProps {
  seconds: number;
  compact?: boolean;
}

function formatSeconds(value: number): string {
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function Timer({ seconds, compact = false }: TimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(seconds);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    setRemainingSeconds(seconds);
  }, [seconds]);

  useEffect(() => {
    if (!isRunning || remainingSeconds <= 0) {
      return undefined;
    }

    const handle = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearInterval(handle);
  }, [isRunning, remainingSeconds]);

  useEffect(() => {
    if (remainingSeconds === 0) {
      setIsRunning(false);
    }
  }, [remainingSeconds]);

  return (
    <div className={clsx("rounded-3xl border border-slate-200 bg-white/80", compact ? "p-4" : "p-5")}>
      <p className="text-sm text-slate-500">计时器</p>
      <p className={clsx("mt-2 font-semibold text-ink", compact ? "text-2xl" : "text-4xl")}>{formatSeconds(remainingSeconds)}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setIsRunning((current) => !current)}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800"
        >
          {isRunning ? "暂停" : remainingSeconds === 0 ? "再来一次" : "开始"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRemainingSeconds(seconds);
            setIsRunning(false);
          }}
          className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-200"
        >
          重置
        </button>
      </div>
    </div>
  );
}
