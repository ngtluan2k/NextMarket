import React, { useEffect } from 'react';
import { useProvinces } from '../hooks/useProvinces';

interface AddressFormData {
  recipient_name: string;
  phone: string;
  street: string;
  district: string;
  province: string;
  ward: string;
  country: string;
  postal_code: string;
  type: string;
  detail: string;
  is_default: boolean;
}

interface AddressModalProps {
  show: boolean;
  editingAddress: any;
  addressFormData: AddressFormData;
  onClose: () => void;
  onInputChange: (field: string, value: any) => void;
  onSave: (version: 'v1' | 'v2') => void;
}

const AddressModal: React.FC<AddressModalProps> = ({
  show,
  editingAddress,
  addressFormData,
  onClose,
  onInputChange,
  onSave,
}) => {
  const [version, setVersion] = React.useState<'v1' | 'v2'>('v2');
  const {
    provinces,
    districts,
    wards,
    selectedProvince,
    selectedDistrict,
    selectedWard,
    loading,
    error,
    handleProvinceChange,
    handleDistrictChange,
    handleWardChange,
    isV2,
    resetLocation,
  } = useProvinces(version);

  // Reset location when modal opens
  useEffect(() => {
    if (show) {
      setVersion('v2');
      // You can add logic here to pre-select values if editing
    }
  }, [show]);

  // Reset location when switching version
  useEffect(() => {
    resetLocation();
    onInputChange('province', '');
    onInputChange('district', '');
    onInputChange('ward', '');
  }, [version]);

  if (!show) return null;

  return (
    <div
      className="modal show d-block"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {editingAddress
                ? '✏️ Chỉnh sửa địa chỉ lấy hàng'
                : '📍 Thêm địa chỉ lấy hàng'}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="d-flex gap-3 mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="addressVersion"
                  id="versionV2"
                  checked={version === 'v2'}
                  onChange={() => setVersion('v2')}
                />
                <label className="form-check-label" htmlFor="versionV2">
                  Địa chỉ V2
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="addressVersion"
                  id="versionV1"
                  checked={version === 'v1'}
                  onChange={() => setVersion('v1')}
                />
                <label className="form-check-label" htmlFor="versionV1">
                  Địa chỉ V1
                </label>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger mb-3">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}
            <form>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Tên người nhận *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={addressFormData.recipient_name}
                      onChange={(e) =>
                        onInputChange('recipient_name', e.target.value)
                      }
                      placeholder="Nguyễn Văn A"
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Số điện thoại *</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={addressFormData.phone}
                      onChange={(e) =>
                        onInputChange('phone', e.target.value)
                      }
                      placeholder="0123456789"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Địa chỉ đường phố *</label>
                <input
                  type="text"
                  className="form-control"
                  value={addressFormData.street}
                  onChange={(e) =>
                    onInputChange('street', e.target.value)
                  }
                  placeholder="123 Nguyễn Văn Linh"
                  required
                />
              </div>

              <div className="row">
                <div className={isV2 ? "col-md-6" : "col-md-4"}>
                  <div className="mb-3">
                    <label className="form-label">Tỉnh/Thành phố *</label>
                    <select
                      className="form-select"
                      value={selectedProvince?.code || ''}
                      onChange={(e) => {
                        const provinceCode = parseInt(e.target.value);
                        const provName = provinces.find(p=>p.code===provinceCode)?.name || '';
                        onInputChange('province', provName);
                        handleProvinceChange(provinceCode);
                      }}
                      required
                      disabled={loading}
                    >
                      <option value="">Chọn tỉnh/thành phố</option>
                      {provinces.map((province) => (
                        <option key={province.code} value={province.code}>
                          {province.name}
                        </option>
                      ))}
                    </select>
                    {loading && <div className="form-text">Đang tải...</div>}
                  </div>
                </div>
                {!isV2 && (
                <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Quận/Huyện *</label>
                      <select
                        className="form-select"
                        value={selectedDistrict?.code || ''}
                        onChange={(e) => {
                          const districtCode = parseInt(e.target.value);
                          const distName = districts.find(d=>d.code===districtCode)?.name || '';
                          onInputChange('district', distName);
                          handleDistrictChange(districtCode);
                        }}
                        required
                        disabled={!selectedProvince || loading}
                      >
                        <option value="">Chọn quận/huyện</option>
                        {districts.map((district) => (
                          <option key={district.code} value={district.code}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                      {!selectedProvince && (
                        <div className="form-text">Vui lòng chọn tỉnh/thành phố trước</div>
                      )}
                    </div>
                </div>
                )}
                <div className={isV2 ? "col-md-6" : "col-md-4"}>
                  <div className="mb-3">
                    <label className="form-label">Phường/Xã *</label>
                    <select
                      className="form-select"
                      value={selectedWard?.code || ''}
                      onChange={(e) => {
                        const wardCode = parseInt(e.target.value);
                        const wardName = wards.find(w=>w.code===wardCode)?.name || '';
                        onInputChange('ward', wardName);
                        handleWardChange(wardCode);
                      }}
                      required
                      disabled={(isV2 && !selectedProvince) || (!isV2 && !selectedDistrict) || loading}
                    >
                      <option value="">Chọn phường/xã</option>
                      {wards.map((ward) => (
                        <option key={ward.code} value={ward.code}>
                          {ward.name}
                        </option>
                      ))}
                    </select>
                    {!isV2 && !selectedDistrict && (
                      <div className="form-text">Vui lòng chọn quận/huyện trước</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Mã bưu điện *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={addressFormData.postal_code}
                      onChange={(e) =>
                        onInputChange('postal_code', e.target.value)
                      }
                      placeholder="700000"
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">Quốc gia *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={addressFormData.country}
                      onChange={(e) =>
                        onInputChange('country', e.target.value)
                      }
                      placeholder="Vietnam"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Chi tiết thêm</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={addressFormData.detail}
                  onChange={(e) =>
                    onInputChange('detail', e.target.value)
                  }
                  placeholder="Ghi chú thêm về địa chỉ..."
                ></textarea>
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
              onClick={() => onSave(version)}
            >
              {editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
