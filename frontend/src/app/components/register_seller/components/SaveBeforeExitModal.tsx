import React from 'react';
import { X, Save, DoorOpen, CircleX, Loader2 } from 'lucide-react';

interface SaveBeforeExitModalProps {
  show: boolean;
  onSave: () => void;
  onDontSave: () => void;
  onCancel: () => void;
  loading?: boolean;
}

const SaveBeforeExitModal: React.FC<SaveBeforeExitModalProps> = ({
  show,
  onSave,
  onDontSave,
  onCancel,
  loading = false,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-800">Lưu thay đổi trước khi thoát?</h3>
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 py-5">
            <p className="text-slate-700">
              Bạn có thay đổi chưa được lưu. Bạn có muốn lưu nháp trước khi thoát không?
            </p>
            {loading && (
              <div className="mt-3 inline-flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <CircleX className="mr-2 h-4 w-4" />
              Hủy
            </button>
            <button
              type="button"
              onClick={onDontSave}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <DoorOpen className="mr-2 h-4 w-4" />
              Không lưu
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={loading}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 active:bg-sky-800 disabled:opacity-60"
            >
              <Save className="mr-2 h-4 w-4" />
              {loading ? 'Đang lưu...' : 'Lưu nháp'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveBeforeExitModal;
