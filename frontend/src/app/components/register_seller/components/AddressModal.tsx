import React, { useEffect } from 'react';
import { useProvinces } from '../hooks/useProvinces';
import { X, Loader2, MapPin, ChevronDown, Building2 } from 'lucide-react';
import {
  validateAddressForm,
  validateAddressField,
  AddressValidationCtx,
} from '../utils/validation';

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

const baseInput =
  'w-full rounded-xl border bg-white px-3 py-1.5 outline-none transition focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60';
const baseSelect =
  'w-full appearance-none rounded-xl border bg-white px-3 py-1.5 pr-9 outline-none transition focus:ring-4';
const baseLabel = 'text-[11px] font-medium text-slate-700';
const ok = 'border-slate-200 focus:border-sky-500 focus:ring-sky-100';
const err = 'border-rose-300 focus:border-rose-500 focus:ring-rose-100';

const AddressModal: React.FC<AddressModalProps> = ({
  show,
  editingAddress,
  addressFormData,
  onClose,
  onInputChange,
  onSave,
}) => {
  const [version, setVersion] = React.useState<'v1' | 'v2'>('v2');
  const [errors, setErrors] = React.useState<Record<string, string>>({});

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

  const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');
  const trim = (s?: string) => (s ?? '').trim();

  useEffect(() => { if (show) setVersion('v2'); }, [show]);

  useEffect(() => {
    resetLocation();
    onInputChange('province', '');
    onInputChange('district', '');
    onInputChange('ward', '');
    setErrors({});
  }, [version]);

  if (!show) return null;

  const ctx: AddressValidationCtx = {
    isV2,
    provinceCode: selectedProvince?.code ?? null,
    districtCode: selectedDistrict?.code ?? null,
    wardCode: selectedWard?.code ?? null,
  };

  const withErr = (field: string) =>
    `${
      field === 'province' || field === 'district' || field === 'ward' ? baseSelect : baseInput
    } ${errors[field] ? err : ok}`;

  const handleBlur = (field: any) => {
    const msg = validateAddressField(addressFormData as any, field, ctx);
    setErrors((p) => ({ ...p, [field]: msg }));
  };

  const handleSubmit = () => {
    const nextErrors = validateAddressForm(addressFormData as any, ctx);
    setErrors(nextErrors as Record<string, string>);
    if (Object.keys(nextErrors).length === 0) onSave(version);
  };

  const clearFieldError = (field: string, value: any) => {
    if (errors[field]) {
      setErrors((p) => { const n = { ...p }; delete n[field]; return n; });
    }
    onInputChange(field, value);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="addressModalTitle">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-100 bg-white shadow-xl ring-1 ring-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 id="addressModalTitle" className="text-sm font-semibold text-slate-800">
            {editingAddress ? 'Chỉnh sửa địa chỉ lấy hàng' : 'Thêm địa chỉ lấy hàng'}
          </h3>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="mb-3 inline-flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setVersion('v2')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${version === 'v2' ? 'bg-white text-sky-700 shadow-sm ring-1 ring-sky-200' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Địa chỉ V2
            </button>
            <button
              type="button"
              onClick={() => setVersion('v1')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ${version === 'v1' ? 'bg-white text-sky-700 shadow-sm ring-1 ring-sky-200' : 'text-slate-600 hover:text-slate-800'}`}
            >
              Địa chỉ V1
            </button>
          </div>

          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] text-rose-700">
              <Building2 className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={`${baseLabel} mb-1 block`}>Tên người nhận *</label>
                <input
                  className={withErr('recipient_name')}
                  value={addressFormData.recipient_name}
                  onBlur={() => { const v = trim(addressFormData.recipient_name); clearFieldError('recipient_name', v); handleBlur('recipient_name'); }}
                  onChange={(e) => clearFieldError('recipient_name', e.target.value)}
                  placeholder="Nguyễn Văn A"
                />
                {errors.recipient_name && <p className="mt-1 text-[11px] text-rose-600">{errors.recipient_name}</p>}
              </div>
              <div>
                <label className={`${baseLabel} mb-1 block`}>Số điện thoại *</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  className={withErr('phone')}
                  value={addressFormData.phone}
                  onBlur={() => handleBlur('phone')}
                  onChange={(e) => clearFieldError('phone', onlyDigits(e.target.value).slice(0, 11))}
                  placeholder="0123456789"
                />
                {errors.phone && <p className="mt-1 text-[11px] text-rose-600">{errors.phone}</p>}
              </div>
            </div>

            <div>
              <label className={`${baseLabel} mb-1 block`}>Địa chỉ đường phố *</label>
              <input
                className={withErr('street')}
                value={addressFormData.street}
                onBlur={() => { const v = trim(addressFormData.street); clearFieldError('street', v); handleBlur('street'); }}
                onChange={(e) => clearFieldError('street', e.target.value)}
                placeholder="123 Nguyễn Văn Linh"
              />
              {errors.street && <p className="mt-1 text-[11px] text-rose-600">{errors.street}</p>}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className={`${baseLabel} mb-1 block`}>Tỉnh/Thành phố *</label>
                <div className="relative">
                  <select
                    className={`${withErr('province')}`}
                    value={selectedProvince?.code || ''}
                    onBlur={() => handleBlur('province')}
                    onChange={(e) => {
                      const provinceCode = parseInt(e.target.value);
                      const provName = provinces.find((p) => p.code === provinceCode)?.name || '';
                      clearFieldError('province', provName);
                      handleProvinceChange(provinceCode);
                    }}
                    disabled={loading}
                  >
                    <option value="">Chọn tỉnh/thành phố</option>
                    {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                {loading && <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-slate-500"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải...</div>}
                {errors.province && <p className="mt-1 text-[11px] text-rose-600">{errors.province}</p>}
              </div>

              {!isV2 && (
                <div>
                  <label className={`${baseLabel} mb-1 block`}>Quận/Huyện *</label>
                  <div className="relative">
                    <select
                      className={withErr('district')}
                      value={selectedDistrict?.code || ''}
                      onBlur={() => handleBlur('district')}
                      onChange={(e) => {
                        const districtCode = parseInt(e.target.value);
                        const distName = districts.find((d) => d.code === districtCode)?.name || '';
                        clearFieldError('district', distName);
                        handleDistrictChange(districtCode);
                      }}
                      disabled={!selectedProvince || loading}
                    >
                      <option value="">Chọn quận/huyện</option>
                      {districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  {errors.district && <p className="mt-1 text-[11px] text-rose-600">{errors.district}</p>}
                </div>
              )}

              <div>
                <label className={`${baseLabel} mb-1 block`}>Phường/Xã *</label>
                <div className="relative">
                  <select
                    className={withErr('ward')}
                    value={selectedWard?.code || ''}
                    onBlur={() => handleBlur('ward')}
                    onChange={(e) => {
                      const wardCode = parseInt(e.target.value);
                      const wardName = wards.find((w) => w.code === wardCode)?.name || '';
                      clearFieldError('ward', wardName);
                      handleWardChange(wardCode);
                    }}
                    disabled={(isV2 && !selectedProvince) || (!isV2 && !selectedDistrict) || loading}
                  >
                    <option value="">Chọn phường/xã</option>
                    {wards.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
                {errors.ward && <p className="mt-1 text-[11px] text-rose-600">{errors.ward}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={`${baseLabel} mb-1 block`}>Mã bưu điện *</label>
                <input
                  className={withErr('postal_code')}
                  value={addressFormData.postal_code}
                  onBlur={() => handleBlur('postal_code')}
                  onChange={(e) => clearFieldError('postal_code', onlyDigits(e.target.value).slice(0, 6))}
                  placeholder="700000"
                />
                {errors.postal_code && <p className="mt-1 text-[11px] text-rose-600">{errors.postal_code}</p>}
              </div>
              <div>
                <label className={`${baseLabel} mb-1 block`}>Quốc gia *</label>
                <input
                  className={withErr('country')}
                  value={addressFormData.country}
                  onBlur={() => { const v = trim(addressFormData.country); clearFieldError('country', v); handleBlur('country'); }}
                  onChange={(e) => clearFieldError('country', e.target.value)}
                  placeholder="Vietnam"
                />
                {errors.country && <p className="mt-1 text-[11px] text-rose-600">{errors.country}</p>}
              </div>
            </div>

            <div>
              <label className={`${baseLabel} mb-1 block`}>Chi tiết thêm</label>
              <textarea rows={2} className={`${baseInput} ${ok}`} value={addressFormData.detail} onChange={(e) => onInputChange('detail', e.target.value)} placeholder="Ghi chú thêm về địa chỉ..." />
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 hover:bg-slate-50">
            Hủy
          </button>
          <button type="button" onClick={handleSubmit} className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 active:bg-sky-800">
            <MapPin className="mr-2 h-4 w-4" />{editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;