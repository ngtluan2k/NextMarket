import React from 'react';

interface EmailFormData {
  email: string;
  description: string;
  is_default: boolean;
}

interface EmailModalProps {
  show: boolean;
  editingEmail: any;
  emailFormData: EmailFormData;
  onClose: () => void;
  onInputChange: (field: string, value: any) => void;
  onSave: () => void;
}

const EmailModal: React.FC<EmailModalProps> = ({
  show,
  editingEmail,
  emailFormData,
  onClose,
  onInputChange,
  onSave,
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
            <h5 className="modal-title">
              {editingEmail
                ? '✏️ Chỉnh sửa email nhận hóa đơn'
                : '📧 Thêm email nhận hóa đơn'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <form>
              <div className="mb-3">
                <label className="form-label">Địa chỉ email *</label>
                <input
                  type="email"
                  className="form-control"
                  value={emailFormData.email}
                  onChange={(e) =>
                    onInputChange('email', e.target.value)
                  }
                  placeholder="example@company.com"
                  required
                />
              </div>
            </form>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={onSave}
            >
              {editingEmail ? 'Cập nhật email' : 'Thêm email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
