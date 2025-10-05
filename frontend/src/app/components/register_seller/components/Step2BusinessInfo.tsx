import React from 'react';
import { SellerFormData } from '../../types';

interface Step2BusinessInfoProps {
  formData: SellerFormData;
  emails: Array<{
    id: number;
    email: string;
    is_default: boolean;
    description?: string;
  }>;
  selectedDocFile: File | null;
  businessLicenseUrl: string;
  onInputChange: (field: string, value: any) => void;
  onShowEmailModal: () => void;
  onShowSelectEmailModal: () => void;
  onEditEmail: (email: any) => void;
  onSetDefaultEmail: (emailId: number) => void;
  onDeleteEmail: (emailId: number) => void;
  onDocFileChange: (file: File | null) => void;
}

const Step2BusinessInfo: React.FC<Step2BusinessInfoProps> = ({
  formData,
  emails,
  selectedDocFile,
  businessLicenseUrl,
  onInputChange,
  onShowEmailModal,
  onShowSelectEmailModal,
  onEditEmail,
  onSetDefaultEmail,
  onDeleteEmail,
  onDocFileChange,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h5>📋 Thông tin thuế </h5>
      </div>
      <div className="card-body">
        <div className="alert alert-info">
          <i className="bi bi-info-circle"></i>
          <strong>
            Việc thu thập Thông Tin Thuế và Thông Tin Định Danh là bắt buộc theo
            quy định. Người bán chịu trách nhiệm về tính chính xác của thông
            tin.
          </strong>
        </div>

        {/* Loại hình kinh doanh */}
        <div className="mb-4">
          <h6>Loại hình kinh doanh</h6>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="businessType"
              value="company"
              checked={formData.store_information.type === 'company'}
              onChange={(e) => onInputChange('type', e.target.value)}
            />
            <label className="form-check-label">Hộ kinh doanh / Công ty</label>
          </div>
        </div>

        {/* Tên công ty */}
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Tên công ty *</label>
              <input
                type="text"
                className="form-control"
                value={formData.store_information.name}
                onChange={(e) => onInputChange('name', e.target.value)}
                placeholder="Nhập vào"
                maxLength={255}
                required
              />
              <small className="text-muted">0/255</small>
            </div>
          </div>
        </div>

        {/* Địa chỉ đăng ký KD */}
        <div className="mb-3">
          <label className="form-label">Địa chỉ đăng ký kinh doanh</label>
          <input
            type="text"
            className="form-control"
            value={formData.store_information.addresses || ''}
            onChange={(e) => onInputChange('addresses', e.target.value)}
            placeholder="An Giang / Huyện An Phú / Thị Trấn An Phú"
          />
        </div>

        {/* Email hóa đơn */}
        <div className="mb-3">
          <label className="form-label">Email nhận hóa đơn điện tử</label>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="text-muted">
              {emails.length > 0
                ? `${emails.length} email đã thêm`
                : 'Chưa có email'}
            </span>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={onShowEmailModal}
            >
              + Thêm
            </button>
          </div>
          {/* Hiển thị email mặc định */}
          {emails.length > 0 && (
            <div className="border rounded p-3 bg-light">
              {(() => {
                const defaultEmail = emails.find((email) => email.is_default);
                if (!defaultEmail) return null;
                return (
                  <div className="bg-white rounded p-3 border">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="fw-bold text-primary mb-1">
                          📧 {defaultEmail.email}
                        </div>
                        {defaultEmail.description && (
                          <div className="text-muted small mb-2">
                            💬 {defaultEmail.description}
                          </div>
                        )}
                        <span className="badge bg-success">Email mặc định</span>
                      </div>
                      <div className="d-flex gap-1">
                        <button
                          type="button"
                          className="btn btn-outline-success btn-sm"
                          onClick={() => onEditEmail(defaultEmail)}
                          title="Chỉnh sửa email"
                        >
                          ✏️ Cập nhật
                        </button>
                        {emails.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={onShowSelectEmailModal}
                            title="Thay đổi email mặc định"
                          >
                            🔄 Thay đổi
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => onDeleteEmail(defaultEmail.id)}
                          title="Xóa email"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          <p className="small text-muted mt-2">
            Hóa đơn điện tử sẽ được gửi đến email mặc định (tối đa 5 email)
          </p>
        </div>

        {/* Mã số thuế */}
        <div className="row">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Mã số thuế</label>
              <input
                type="text"
                className="form-control"
                value={formData.store_information.tax_code || ''}
                onChange={(e) => onInputChange('tax_code', e.target.value)}
                placeholder="Nhập vào"
                maxLength={14}
              />
              <small className="text-muted">0/14</small>
            </div>
          </div>
        </div>

        {/* Giấy phép */}
        <div className="mb-3">
          <label className="form-label">Giấy phép đăng ký kinh doanh</label>

          {/* Chọn file */}
          <div className="d-flex gap-2 align-items-center mb-2">
            <input
              type="file"
              className="form-control"
              accept="image/png, image/jpeg, application/pdf"
              onChange={(e) => onDocFileChange(e.target.files?.[0] || null)}
            />
          </div>

          <p className="text-muted small mb-2">
            Hỗ trợ PDF/JPG/PNG, tối đa 10MB. File sẽ lưu với loại:
            BUSINESS_LICENSE.
          </p>

          {businessLicenseUrl && (
            <div className="mt-3">
              <div className="small text-muted mb-2">Xem nhanh Giấy phép:</div>
              {businessLicenseUrl.startsWith('/uploads') ? (
                /\.(png|jpe?g|webp|gif)$/i.test(businessLicenseUrl) ? (
                  <img
                    src={`http://localhost:3000${businessLicenseUrl}`}
                    alt="Business License"
                    style={{
                      maxWidth: 280,
                      maxHeight: 240,
                      border: '1px solid #eee',
                      borderRadius: 6,
                    }}
                  />
                ) : (
                  <a
                    className="btn btn-outline-secondary btn-sm"
                    href={`http://localhost:3000${businessLicenseUrl}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mở file
                  </a>
                )
              ) : (
                <img
                  src={businessLicenseUrl}
                  alt="Business License (local)"
                  style={{
                    maxWidth: 280,
                    maxHeight: 240,
                    border: '1px solid #eee',
                    borderRadius: 6,
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step2BusinessInfo;
