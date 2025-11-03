import React, { useImperativeHandle } from 'react';
import { SellerFormData } from '../../types';
import CCCDUpload from '../CCCDUpload';

export type Step3IdentificationHandle = { validateAll: () => boolean; clearErrors: () => void; };

interface Step3IdentificationProps {
  formData: SellerFormData;
  onInputChange: (field: string, value: any) => void;
  onBankAccountChange: (field: string, value: any) => void;
  onFileSelected: (side: 'front' | 'back', file: File | null) => void;
  frontFile?: File | null;
  backFile?: File | null;
}

const baseInput = 'w-full rounded-xl border bg-white px-3 py-1.5 outline-none transition focus:ring-4';
const baseLabel = 'text-[11px] font-medium text-slate-700';
const ok = 'border-slate-200 focus:border-sky-500 focus:ring-sky-100';
const er = 'border-rose-300 focus:border-rose-500 focus:ring-rose-100';
const withErr = (b: boolean) => `${baseInput} ${b ? er : ok}`;

const Step3Identification = React.forwardRef<Step3IdentificationHandle, Step3IdentificationProps>(
  ({ formData, onInputChange, onBankAccountChange, onFileSelected, frontFile, backFile }, ref) => {
    const [errors, setErrors] = React.useState<{ full_name?: string; img_front?: string; img_back?: string; bank_name?: string; account_number?: string; account_holder?: string; }>({});

    const trim = (v?: string) => (v ?? '').trim();
    const onlyDigits = (s: string) => (s || '').replace(/\D/g, '');

    const validateField = (f: keyof typeof errors): string => {
      const hasFront = !!frontFile || !!trim(formData.store_identification?.img_front);
      const hasBack = !!backFile || !!trim(formData.store_identification?.img_back);
      switch (f) {
        case 'full_name': return trim(formData.store_identification?.full_name) ? '' : 'Vui lòng nhập họ tên đầy đủ';
        case 'img_front': return hasFront ? '' : 'Vui lòng tải lên ảnh CCCD mặt trước';
        case 'img_back': return hasBack ? '' : 'Vui lòng tải lên ảnh CCCD mặt sau';
        case 'bank_name': return trim(formData.bank_account?.bank_name) ? '' : 'Vui lòng nhập tên ngân hàng';
        case 'account_number': {
          const v = trim(formData.bank_account?.account_number);
          if (!v) return 'Vui lòng nhập số tài khoản';
          if (!/^\d{6,20}$/.test(v)) return 'Số tài khoản chỉ gồm số (6–20 ký tự)';
          return '';
        }
        case 'account_holder': return trim(formData.bank_account?.account_holder) ? '' : 'Vui lòng nhập tên chủ tài khoản';
        default: return '';
      }
    };

    const handleBlur = (f: keyof typeof errors) => setErrors((p) => ({ ...p, [f]: validateField(f) }));

    React.useEffect(() => {
      setErrors((p) => ({ ...p, img_front: validateField('img_front'), img_back: validateField('img_back') }));
    }, [frontFile, backFile, formData.store_identification?.img_front, formData.store_identification?.img_back]);

    const validateAll = () => {
      const next = {
        full_name: validateField('full_name'),
        img_front: validateField('img_front'),
        img_back: validateField('img_back'),
        bank_name: validateField('bank_name'),
        account_number: validateField('account_number'),
        account_holder: validateField('account_holder'),
      };
      setErrors(next);
      return !Object.values(next).some(Boolean);
    };

    useImperativeHandle(ref, () => ({ validateAll, clearErrors: () => setErrors({}) }), [formData, frontFile, backFile]);

    return (
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h5 className="text-base font-semibold text-slate-800">Thông tin định danh</h5>
        </div>

        <div className="px-5 py-4">
          {/* Định danh */}
          <div className="mb-4">
            <h6 className="mb-1 text-xs font-semibold text-slate-800">Thông tin định danh</h6>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={`${baseLabel} mb-1 block`}>Loại giấy tờ *</label>
                <select className={`${baseInput} ${ok} pr-9 appearance-none`} value={formData.store_identification.type} onChange={(e) => onInputChange('type', e.target.value)}>
                  <option value="CCCD">Căn cước công dân</option>
                </select>
              </div>
            </div>

            <div className="mt-2">
              <CCCDUpload onFileSelected={onFileSelected} frontFile={frontFile} backFile={backFile} className="mt-2" />
              {errors.img_front && <p className="mt-1 text-[11px] text-rose-600">{errors.img_front}</p>}
              {errors.img_back && <p className="mt-1 text-[11px] text-rose-600">{errors.img_back}</p>}
            </div>

            <div className="mt-3">
              <label className={`${baseLabel} mb-1 block`}>Họ tên đầy đủ *</label>
              <input
                className={withErr(!!errors.full_name)}
                aria-invalid={!!errors.full_name}
                value={formData.store_identification.full_name}
                onChange={(e) => onInputChange('full_name', e.target.value)}
                onBlur={() => { const v = trim(formData.store_identification.full_name); onInputChange('full_name', v); handleBlur('full_name'); }}
                placeholder="Nhập họ tên đầy đủ"
              />
              {errors.full_name && <p className="mt-1 text-[11px] text-rose-600">{errors.full_name}</p>}
            </div>
          </div>

          {/* Ngân hàng */}
          <div>
            <h6 className="mb-1 text-xs font-semibold text-slate-800">Thông tin tài khoản ngân hàng</h6>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className={`${baseLabel} mb-1 block`}>Tên ngân hàng *</label>
                <input
                  className={withErr(!!errors.bank_name)}
                  value={formData.bank_account.bank_name}
                  onChange={(e) => onBankAccountChange('bank_name', e.target.value)}
                  onBlur={() => handleBlur('bank_name')}
                  placeholder="Vietcombank"
                />
                {errors.bank_name && <p className="mt-1 text-[11px] text-rose-600">{errors.bank_name}</p>}
              </div>

              <div>
                <label className={`${baseLabel} mb-1 block`}>Số tài khoản *</label>
                <input
                  inputMode="numeric"
                  className={withErr(!!errors.account_number)}
                  value={formData.bank_account.account_number}
                  onChange={(e) => onBankAccountChange('account_number', onlyDigits(e.target.value).slice(0, 20))}
                  onBlur={() => handleBlur('account_number')}
                  placeholder="1234567890"
                />
                {errors.account_number && <p className="mt-1 text-[11px] text-rose-600">{errors.account_number}</p>}
              </div>
            </div>

            <div className="mt-3">
              <label className={`${baseLabel} mb-1 block`}>Chủ tài khoản *</label>
              <input
                className={withErr(!!errors.account_holder)}
                value={formData.bank_account.account_holder}
                onChange={(e) => onBankAccountChange('account_holder', e.target.value)}
                onBlur={() => handleBlur('account_holder')}
                placeholder="Nguyễn Văn A"
              />
              {errors.account_holder && <p className="mt-1 text-[11px] text-rose-600">{errors.account_holder}</p>}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

Step3Identification.displayName = 'Step3Identification';
export default Step3Identification;
