import React from 'react';

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
    <div className="d-flex justify-content-between align-items-center mt-4">
      <button 
        className="btn btn-outline-secondary" 
        onClick={onPrevStep} 
        disabled={currentStep === 1}
      >
        Quay lại
      </button>

      <div className="d-flex gap-2">
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={() => {
            if (window.confirm('Bạn có chắc muốn xóa tất cả dữ liệu đã nhập?')) {
              onClearData();
            }
          }}
          title="Xóa tất cả dữ liệu đã nhập"
        >
          🗑️ Clear
        </button>
      </div>

      {currentStep < totalSteps && (
        <button 
          className="btn btn-danger" 
          onClick={onNextStep} 
          disabled={currentStep === totalSteps || loading}
        >
          {loading ? 'Đang xử lý...' : 'Tiếp theo'}
        </button>
      )}
    </div>
  );
};

export default StepNavigation;
