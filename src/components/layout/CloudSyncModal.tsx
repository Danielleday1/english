import { Cloud, X } from "lucide-react";
import { CloudSyncPanel } from "../progress/CloudSyncPanel";

interface CloudSyncModalProps {
  open: boolean;
  onClose: () => void;
}

export function CloudSyncModal({ open, onClose }: CloudSyncModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/25 px-4 py-8 backdrop-blur-sm sm:py-10">
      <div className="w-full max-w-5xl rounded-[32px] border border-white/70 bg-white/95 p-4 shadow-panel sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 pb-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
              <Cloud className="h-3.5 w-3.5" />
              Cloud Sync
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-ink">云端同步</h2>
              <p className="mt-2 text-sm leading-7 text-slate-500">
                本机优先保存，联网后自动同步。换电脑登录同一账号后，会自动恢复最新记录。
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-ink"
            aria-label="关闭云端同步"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 max-h-[calc(100vh-10rem)] overflow-y-auto pr-1">
          <CloudSyncPanel />
        </div>
      </div>
    </div>
  );
}
