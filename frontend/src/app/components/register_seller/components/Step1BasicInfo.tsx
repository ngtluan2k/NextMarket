import React, { useImperativeHandle } from 'react';
import { SellerFormData } from '../../types';
import {
  MapPin,
  Phone,
  Edit,
  RotateCw,
  Trash2,
  User,
  Building2,
} from 'lucide-react';
import { isValidVNPhone } from '../utils/validation';
import SelectAddressModal from '../components/SelectAddressModal'; // ✅ import modal riêng

export type Step1BasicInfoHandle = {
  validateAll: () => boolean;
  clearErrors: () => void;
};

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
  'w-full rounded-xl border bg-white px-3 py-1.5 outline-none transition focus:ring-4';
const baseLabel = 'text-[11px] font-medium text-slate-700';
const ok = 'border-slate-200 focus:border-sky-500 focus:ring-sky-100';
const er = 'border-rose-300 focus:border-rose-500 focus:ring-rose-100';
const withErr = (b: boolean) => `${baseInput} ${b ? er : ok}`;
const actionBtn =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50';
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Step1BasicInfo = React.forwardRef<Step1BasicInfoHandle, Step1BasicInfoProps>(
  (props, ref) => {
    const {
      formData,
      addresses,
      onBasicChange,
      onShowAddressModal,
      onEditAddress,
      onDeleteAddress,
      onSetDefaultAddress,
    } = props;

    const [showSelectModal, setShowSelectModal] = React.useState(false); // ✅ modal state
    const defaultAddress = addresses.find((a) => a.is_default);

    const [errors, setErrors] = React.useState<{
      name?: string;
      email?: string;
      phone?: string;
      defaultAddress?: string;
    }>({});

    const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');
    const trim = (s?: string) => (s ?? '').trim();

    const validateField = (f: 'name' | 'email' | 'phone' | 'defaultAddress') => {
      switch (f) {
        case 'name':
          return trim(formData.name) ? '' : 'Vui lòng nhập tên shop';
        case 'email': {
          const v = trim(formData.email)?.toLowerCase() || '';
          if (!v) return 'Vui lòng nhập email';
          if (!emailRegex.test(v)) return 'Email không hợp lệ';
          return '';
        }
        case 'phone': {
          const v = trim(formData.phone);
          if (!v) return 'Vui lòng nhập số điện thoại';
          if (!isValidVNPhone(v)) return 'Số điện thoại không đúng định dạng';
          return '';
        }
        case 'defaultAddress':
          return defaultAddress
            ? ''
            : 'Vui lòng thêm 1 địa chỉ và đặt làm mặc định';
      }
    };

    React.useEffect(() => {
      const msg = validateField('defaultAddress');
      setErrors((p) => ({ ...p, defaultAddress: msg }));
    }, [addresses?.length, defaultAddress?.id]);

    const validateAll = () => {
      const next = {
        name: validateField('name'),
        email: validateField('email'),
        phone: validateField('phone'),
        defaultAddress: validateField('defaultAddress'),
      };
      setErrors(next);
      return !Object.values(next).some(Boolean);
    };

    useImperativeHandle(
      ref,
      () => ({
        validateAll,
        clearErrors: () => setErrors({}),
      }),
      [formData, addresses]
    );

    return (
      <>
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-3 flex items-center gap-2 text-slate-800">
            <Building2 className="h-5 w-5" />
            <h5 className="text-base font-semibold">Thông tin Shop</h5>
          </div>

          <div className="px-5 py-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={`${baseLabel} mb-1 block`}>Tên Shop *</label>
                <input
                  className={withErr(!!errors.name)}
                  aria-invalid={!!errors.name}
                  value={formData.name}
                  onBlur={() => {
                    const v = trim(formData.name);
                    onBasicChange('name', v);
                    setErrors((p) => ({ ...p, name: validateField('name') }));
                  }}
                  onChange={(e) => onBasicChange('name', e.target.value)}
                  placeholder="Tên shop"
                  maxLength={30}
                />
                {errors.name ? (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.name}</p>
                ) : (
                  <small className="mt-1 block text-[11px] text-slate-500">
                    {formData.name.length}/30
                  </small>
                )}
              </div>
            </div>

            {/* Địa chỉ lấy hàng */}
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between">
                <label className={baseLabel}>
                  Địa chỉ lấy hàng <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                  onClick={onShowAddressModal}
                >
                  <MapPin className="mr-2 h-4 w-4" /> Thêm
                </button>
              </div>

              {errors.defaultAddress && (
                <p className="mb-1 text-[11px] text-rose-600">
                  {errors.defaultAddress}
                </p>
              )}
              <div className="text-xs text-slate-500">
                {addresses.length > 0
                  ? `${addresses.length} địa chỉ đã thêm`
                  : 'Chưa có địa chỉ'}
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
                          {defaultAddress.city || defaultAddress.district},{' '}
                          {defaultAddress.province}
                          {defaultAddress.postal_code &&
                            ` - ${defaultAddress.postal_code}`}
                        </div>
                        {defaultAddress.detail && (
                          <div className="mt-0.5 text-xs text-slate-500">
                            {defaultAddress.detail}
                          </div>
                        )}
                        <span className="mt-1 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                          Địa chỉ mặc định
                        </span>
                      </div>

                      <div className="flex shrink-0 gap-1.5">
                        <button
                          type="button"
                          className={actionBtn}
                          onClick={() => onEditAddress(defaultAddress)}
                        >
                          <Edit className="h-4 w-4" /> Cập nhật
                        </button>
                        {addresses.length > 1 && (
                          <button
                            type="button"
                            className={actionBtn}
                            onClick={() => setShowSelectModal(true)} // ✅ mở modal
                          >
                            <RotateCw className="h-4 w-4" /> Thay đổi
                          </button>
                        )}
                        <button
                          type="button"
                          className={actionBtn}
                          onClick={() => onDeleteAddress(defaultAddress.id)}
                        >
                          <Trash2 className="h-4 w-4" /> Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="mt-4">
              <label className={`${baseLabel} mb-1 block`}>
                Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                className={withErr(!!errors.email)}
                aria-invalid={!!errors.email}
                value={formData.email || ''}
                onBlur={() => {
                  const n = trim(formData.email)?.toLowerCase() || '';
                  onBasicChange('email', n);
                  setErrors((p) => ({ ...p, email: validateField('email') }));
                }}
                onChange={(e) => onBasicChange('email', e.target.value)}
                placeholder="Nhập vào"
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-rose-600">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={`${baseLabel} mb-1 block`}>
                  Số điện thoại *
                </label>
                <div className="flex">
                  <span className="inline-flex items-center rounded-l-xl border border-r-0 border-slate-200 bg-slate-50 px-3 text-xs text-slate-600">
                    +84
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    className={withErr(!!errors.phone) + ' rounded-l-none'}
                    aria-invalid={!!errors.phone}
                    value={formData.phone || ''}
                    onBlur={() =>
                      setErrors((p) => ({ ...p, phone: validateField('phone') }))
                    }
                    onChange={(e) =>
                      onBasicChange('phone', onlyDigits(e.target.value).slice(0, 9))
                    }
                    placeholder="367"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-[11px] text-rose-600">{errors.phone}</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <SelectAddressModal
          open={showSelectModal}
          addresses={addresses}
          onClose={() => setShowSelectModal(false)}
          onSelect={(id) => {
            onSetDefaultAddress(id);
            setShowSelectModal(false);
          }}
        />
      </>
    );
  }
);

Step1BasicInfo.displayName = 'Step1BasicInfo';
export default Step1BasicInfo;
