interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "确认",
  cancelLabel = "取消",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-900/25 px-4 py-8 backdrop-blur-sm sm:py-16">
      <div className="mt-[8vh] w-full max-w-md rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-panel">
        <h3 className="text-xl font-semibold text-ink">{title}</h3>
        <p className="mt-3 text-sm leading-7 text-slate-500">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-600">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
