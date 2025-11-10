import { CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react';
import React from 'react';

export type ResultType = 'success' | 'error' | 'warning';

export default function ResultModal({
  open,
  type,
  title,
  message,
  onClose,
  autoCloseMs,
}: {
  open: boolean;
  type: ResultType;
  title: string;
  message?: string;
  onClose: () => void;
  autoCloseMs?: number; // ví dụ 1200ms nếu muốn tự tắt
}) {
  React.useEffect(() => {
    if (!open || !autoCloseMs) return;
    const t = setTimeout(onClose, autoCloseMs);
    return () => clearTimeout(t);
  }, [open, autoCloseMs, onClose]);

  if (!open) return null;

  const Icon =
    type === 'success' ? CheckCircle2 :
    type === 'error' ? XCircle :
    AlertTriangle;

  const color =
    type === 'success' ? 'text-emerald-600' :
    type === 'error' ? 'text-rose-600' :
    'text-amber-600';

  const ring =
    type === 'success' ? 'ring-emerald-200' :
    type === 'error' ? 'ring-rose-200' :
    'ring-amber-200';

  const bgPill =
    type === 'success' ? 'bg-emerald-50' :
    type === 'error' ? 'bg-rose-50' :
    'bg-amber-50';

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* panel */}
      <div className="relative z-10 w-[min(96vw,520px)] rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-start gap-3 p-5 md:p-6">
          <div className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full ${bgPill} ${ring}`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {message ? (
              <p className="mt-1 text-sm text-slate-600">{message}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 p-4">
          <button
            onClick={onClose}
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
