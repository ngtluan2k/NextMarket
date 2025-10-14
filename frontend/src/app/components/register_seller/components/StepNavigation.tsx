import React from 'react';
import { ArrowLeft, ArrowRight, Trash2 } from 'lucide-react';

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  loading: boolean;
  onPrevStep: () => void;
  onNextStep: () => void;
  onClearData: () => void;
}

const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  loading,
  onPrevStep,
  onNextStep,
  onClearData,
}) => {
  return (
    <div className="mt-6 flex items-center justify-between">
      <button
        className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        onClick={onPrevStep}
        disabled={currentStep === 1}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại
      </button>

      <div className="flex items-center gap-2">
        <button
          className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
          onClick={() => {
            if (window.confirm('Bạn có chắc muốn xóa tất cả dữ liệu đã nhập?')) {
              onClearData();
            }
          }}
          title="Xóa tất cả dữ liệu đã nhập"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Clear
        </button>
      </div>

      {currentStep < totalSteps && (
        <button
          className="inline-flex items-center rounded-xl bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          onClick={onNextStep}
          disabled={currentStep === totalSteps || loading}
        >
          {loading ? 'Đang xử lý...' : 'Tiếp theo'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default StepNavigation;
