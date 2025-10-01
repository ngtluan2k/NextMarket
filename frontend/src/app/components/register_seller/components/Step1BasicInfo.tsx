import React from 'react';
import { SellerFormData } from '../../types';

interface Step1BasicInfoProps {
  formData: SellerFormData;
  addresses: any[];
  onBasicChange: (field: keyof SellerFormData, value: any) => void;
  onAddressChange: (addresses: any[]) => void;
  onShowAddressModal: () => void;
  onShowSelectAddressModal: () => void;
  onEditAddress: (address: any) => void;
  onSetDefaultAddress: (addressId: number) => void;
  onDeleteAddress: (addressId: number) => void;
}

const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({
  formData,
  addresses,
  onBasicChange,
  onAddressChange,
  onShowAddressModal,
  onShowSelectAddressModal,
  onEditAddress,
  onSetDefaultAddress,
  onDeleteAddress,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h5>🏪 Thông tin Shop</h5>
      </div>
      <div className="card-body">
        <div className="row">
          {/* Tên Shop */}
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label">Tên Shop *</label>
              <input
                type="text"
                className="form-control"
                value={formData.name}
                onChange={(e) => onBasicChange('name', e.target.value)}
                placeholder="Tên shop"
                maxLength={30}
                required
              />
              <small className="text-muted">{formData.name.length}/30</small>
            </div>
          </div>
        </div>

        {/* Địa chỉ lấy hàng */}
        <div className="mb-3">
          <label className="form-label">Địa chỉ lấy hàng</label>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span className="text-muted">
              {addresses.length > 0
                ? `${addresses.length} địa chỉ đã thêm`
                : 'Chưa có địa chỉ'}
            </span>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              onClick={onShowAddressModal}
            >
              + Thêm
            </button>
          </div>

          {/* Hiển thị địa chỉ mặc định */}
          {addresses.length > 0 && (
            <div className="border rounded p-3 bg-light">
              {(() => {
                const defaultAddress = addresses.find(
                  (addr) => addr.is_default
                );
                if (!defaultAddress) return null;
                return (
                  <div className="bg-white rounded p-3 border">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <div className="fw-bold text-primary mb-1">
                          📍 {defaultAddress.recipient_name}
                        </div>
                        <div className="text-muted small mb-1">
                          📞 {defaultAddress.phone}
                        </div>
                        <div className="mb-1">
                          {defaultAddress.street}, {defaultAddress.city},{' '}
                          {defaultAddress.province}
                          {defaultAddress.postal_code &&
                            ` - ${defaultAddress.postal_code}`}
                        </div>
                        {defaultAddress.detail && (
                          <div className="text-muted small mb-2">
                            💬 {defaultAddress.detail}
                          </div>
                        )}
                        <span className="badge bg-success">
                          Địa chỉ mặc định
                        </span>
                      </div>
                      <div className="d-flex gap-1">
                        <button
                          type="button"
                          className="btn btn-outline-success btn-sm"
                          onClick={() => onEditAddress(defaultAddress)}
                          title="Chỉnh sửa địa chỉ"
                        >
                          ✏️ Cập nhật
                        </button>
                        {addresses.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm"
                            onClick={onShowSelectAddressModal}
                            title="Thay đổi địa chỉ mặc định"
                          >
                            🔄 Thay đổi
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => onDeleteAddress(defaultAddress.id)}
                          title="Xóa địa chỉ"
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
        </div>

        {/* Email */}
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input
            type="email"
            className="form-control"
            value={formData.email || ''}
            onChange={(e) => onBasicChange('email', e.target.value)}
            placeholder="Nhập vào"
          />
        </div>

        {/* Số điện thoại */}
        <div className="row">
          <div className="col-md-6">
            <label className="form-label">Số điện thoại *</label>
            <div className="input-group">
              <span className="input-group-text">+84</span>
              <input
                type="tel"
                className="form-control"
                value={formData.phone || ''}
                onChange={(e) => onBasicChange('phone', e.target.value)}
                placeholder="367"
                required
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step1BasicInfo;
