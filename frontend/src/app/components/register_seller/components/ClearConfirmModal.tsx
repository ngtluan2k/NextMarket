import React from 'react';
import { X, Trash2 } from 'lucide-react';

interface ClearConfirmModalProps {
  show: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ClearConfirmModal: React.FC<ClearConfirmModalProps> = ({ show, onConfirm, onCancel }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-800">Xóa tất cả dữ liệu?</h3>
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
              Thao tác này sẽ <strong>xóa toàn bộ thông tin đã nhập</strong> trong biểu mẫu hiện tại.
              Bạn có chắc chắn muốn tiếp tục không?
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center justify-center rounded-xl bg-rose-600 px-4 py-2 font-medium text-white hover:bg-rose-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa tất cả
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClearConfirmModal;
