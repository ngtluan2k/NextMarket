import React from 'react';
import { SellerFormData } from '../../types';
import { MapPin, Phone, Edit, RotateCw, Trash2, User } from 'lucide-react';

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

const baseInput =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100';
const baseLabel = 'text-xs font-medium text-slate-700';
const actionBtn =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50';

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
  const defaultAddress = addresses.find((addr) => addr.is_default);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3">
        <h5 className="text-base font-semibold text-slate-800">Thông tin Shop</h5>
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className={`${baseLabel} mb-1 block`}>Tên Shop *</label>
            <input
              type="text"
              className={baseInput}
              value={formData.name}
              onChange={(e) => onBasicChange('name', e.target.value)}
              placeholder="Tên shop"
              maxLength={30}
              required
            />
            <small className="mt-1 block text-[11px] text-slate-500">
              {formData.name.length}/30
            </small>
          </div>
        </div>

        {/* Địa chỉ lấy hàng */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label className={baseLabel}>Địa chỉ lấy hàng</label>
            <button
              type="button"
              className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
              onClick={onShowAddressModal}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Thêm
            </button>
          </div>
          <div className="text-xs text-slate-500">
            {addresses.length > 0 ? `${addresses.length} địa chỉ đã thêm` : 'Chưa có địa chỉ'}
          </div>

          {addresses.length > 0 && defaultAddress && (
            <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
              <div className="rounded-lg border border-slate-100 bg-white p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="mb-0.5 flex items-center gap-1.5 text-sky-700">
                      <User className="h-4 w-4" />
                      <span className="text-sm font-semibold">
                        {defaultAddress.recipient_name}
                      </span>
                    </div>
                    <div className="mb-0.5 flex items-center gap-1.5 text-xs text-slate-600">
                      <Phone className="h-4 w-4" />
                      <span>{defaultAddress.phone}</span>
                    </div>
                    <div className="text-sm text-slate-800">
                      {defaultAddress.street},{' '}
                      {defaultAddress.city || (defaultAddress as any).district},{' '}
                      {defaultAddress.province}
                      {defaultAddress.postal_code && ` - ${defaultAddress.postal_code}`}
                    </div>
                    {defaultAddress.detail && (
                      <div className="mt-0.5 text-xs text-slate-500">{defaultAddress.detail}</div>
                    )}
                    <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      Địa chỉ mặc định
                    </span>
                  </div>

                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      className={actionBtn}
                      onClick={() => onEditAddress(defaultAddress)}
                      title="Chỉnh sửa địa chỉ"
                    >
                      <Edit className="h-4 w-4" />
                      Cập nhật
                    </button>
                    {addresses.length > 1 && (
                      <button
                        type="button"
                        className={actionBtn}
                        onClick={onShowSelectAddressModal}
                        title="Thay đổi địa chỉ mặc định"
                      >
                        <RotateCw className="h-4 w-4" />
                        Thay đổi
                      </button>
                    )}
                    <button
                      type="button"
                      className={actionBtn}
                      onClick={() => onDeleteAddress(defaultAddress.id)}
                      title="Xóa địa chỉ"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Email */}
        <div className="mt-4">
          <label className={`${baseLabel} mb-1 block`}>Email</label>
          <input
            type="email"
            className={baseInput}
            value={formData.email || ''}
            onChange={(e) => onBasicChange('email', e.target.value)}
            placeholder="Nhập vào"
          />
        </div>

        {/* Phone */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className={`${baseLabel} mb-1 block`}>Số điện thoại *</label>
            <div className="flex">
              <span className="inline-flex items-center rounded-l-lg border border-r-0 border-slate-200 bg-slate-50 px-3 text-xs text-slate-600">
                +84
              </span>
              <input
                type="tel"
                className={`${baseInput} rounded-l-none`}
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
