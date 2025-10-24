import React from 'react';
import { ArrowLeft, ArrowRight, Trash2, CheckCircle2 } from 'lucide-react';

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
  const isFirst = currentStep === 1;
  const isLast = currentStep === totalSteps;

  return (
    <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
      {/* Bên trái: hiển thị trạng thái bước */}
      <div className="text-sm text-slate-600">
        Bước {currentStep} / {totalSteps}
      </div>

      {/* Bên phải: các nút điều hướng */}
      <div className="flex gap-2">
        {/* Clear */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
          onClick={onClearData}
          title="Xóa tất cả dữ liệu đã nhập"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Xóa dữ liệu
        </button>

        {/* Quay lại */}
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          onClick={onPrevStep}
          disabled={isFirst}
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>

        {/* Tiếp theo / Hoàn tất */}
        {!isLast ? (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-2 font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
            onClick={onNextStep}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : 'Tiếp tục'}
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            onClick={onNextStep /* ở bước 4, onNextStep của bạn sẽ gọi onFinalSubmit */}
            disabled={loading}
          >
            <CheckCircle2 className="h-4 w-4" />
            {loading ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
          </button>
        )}
      </div>
    </div>
  );
};

export default StepNavigation;
