import React from 'react';

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
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">💾 Lưu thay đổi trước khi thoát?</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onCancel}
            ></button>
          </div>
          <div className="modal-body">
            <p>
              Bạn có thay đổi chưa được lưu. Bạn có muốn lưu nháp trước khi
              thoát không?
            </p>
            {loading && (
              <div className="text-center">
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span>Đang lưu...</span>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onDontSave}
              disabled={loading}
            >
              Không lưu
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onSave}
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : '�� Lưu nháp'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveBeforeExitModal;
