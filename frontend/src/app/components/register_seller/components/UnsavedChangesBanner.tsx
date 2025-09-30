import React from 'react';

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
    <div className="alert alert-warning alert-dismissible fade show">
      <i className="bi bi-exclamation-triangle" /> <strong>Chú ý:</strong> Bạn có thay đổi chưa được lưu.
      <button 
        className="btn btn-sm btn-outline-primary ms-2" 
        onClick={onSaveDraft} 
        disabled={loading}
      >
        {loading ? 'Đang lưu...' : '💾 Lưu nháp'}
      </button>
      <button 
        className="btn btn-sm btn-outline-danger ms-2" 
        onClick={() => {
          if (window.confirm('Bạn có chắc muốn hủy tất cả thay đổi?')) {
            onDiscardChanges();
          }
        }}
      >
        🔄 Hủy thay đổi
      </button>
    </div>
  );
};

export default UnsavedChangesBanner;
