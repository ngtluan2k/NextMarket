import React from 'react';
import { AlertTriangle, Save, RotateCcw } from 'lucide-react';

interface UnsavedChangesBannerProps {
  hasUnsavedChanges: boolean;
  loading: boolean;
  onSaveDraft: () => void;
  onDiscardChanges: () => void;
}

const UnsavedChangesBanner: React.FC<UnsavedChangesBannerProps> = ({
  hasUnsavedChanges,
  loading,
  onSaveDraft,
  onDiscardChanges,
}) => {
  if (!hasUnsavedChanges) return null;

  return (
    <div className="mb-4 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex items-center gap-2 text-amber-800">
        <AlertTriangle className="h-5 w-5" />
        <strong>Chú ý:</strong>
        <span>Bạn có thay đổi chưa được lưu.</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          onClick={onSaveDraft}
          disabled={loading}
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? 'Đang lưu...' : 'Lưu nháp'}
        </button>
        <button
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          onClick={() => {
            if (window.confirm('Bạn có chắc muốn hủy tất cả thay đổi?')) {
              onDiscardChanges();
            }
          }}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Hủy thay đổi
        </button>
      </div>
    </div>
  );
};

export default UnsavedChangesBanner;
