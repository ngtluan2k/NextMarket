import React from 'react';
import { SellerFormData } from '../../types';
import CCCDUpload from '../CCCDUpload';

interface Step3IdentificationProps {
  formData: SellerFormData;
  onInputChange: (field: string, value: any) => void;
  onBankAccountChange: (field: string, value: any) => void;
  onFileSelected: (side: 'front' | 'back', file: File | null) => void;
  frontFile?: File | null;
  backFile?: File | null;
}

const baseInput =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100';
const baseLabel = 'text-xs font-medium text-slate-700';

const Step3Identification: React.FC<Step3IdentificationProps> = ({
  formData,
  onInputChange,
  onBankAccountChange,
  onFileSelected,
  frontFile,
  backFile,
}) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3">
        <h5 className="text-base font-semibold text-slate-800">Thông tin định danh</h5>
      </div>

      <div className="px-5 py-4">
        <div className="mb-4">
          <h6 className="mb-1 text-xs font-semibold text-slate-800">Thông tin định danh</h6>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className={`${baseLabel} mb-1 block`}>Loại giấy tờ *</label>
              <select
                className={`${baseInput} pr-8`}
                value={formData.store_identification.type}
                onChange={(e) => onInputChange('type', e.target.value)}
                required
              >
                <option value="CCCD">Căn cước công dân</option>
              </select>
            </div>
          </div>

          <CCCDUpload
            onFileSelected={onFileSelected}
            frontFile={frontFile}
            backFile={backFile}
            className="mt-2"
          />

          <div className="mt-3">
            <label className={`${baseLabel} mb-1 block`}>Họ tên đầy đủ *</label>
            <input
              type="text"
              className={baseInput}
              value={formData.store_identification.full_name}
              onChange={(e) => onInputChange('full_name', e.target.value)}
              placeholder="Nhập họ tên đầy đủ"
              required
            />
          </div>
        </div>

        {/* Ngân hàng */}
        <div>
          <h6 className="mb-1 text-xs font-semibold text-slate-800">Thông tin tài khoản ngân hàng</h6>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className={`${baseLabel} mb-1 block`}>Tên ngân hàng *</label>
              <input
                type="text"
                className={baseInput}
                value={formData.bank_account.bank_name}
                onChange={(e) => onBankAccountChange('bank_name', e.target.value)}
                placeholder="Vietcombank"
                required
              />
            </div>
            <div>
              <label className={`${baseLabel} mb-1 block`}>Số tài khoản *</label>
              <input
                type="text"
                className={baseInput}
                value={formData.bank_account.account_number}
                onChange={(e) => onBankAccountChange('account_number', e.target.value)}
                placeholder="1234567890"
                required
              />
            </div>
          </div>

          <div className="mt-3">
            <label className={`${baseLabel} mb-1 block`}>Chủ tài khoản *</label>
            <input
              type="text"
              className={baseInput}
              value={formData.bank_account.account_holder}
              onChange={(e) => onBankAccountChange('account_holder', e.target.value)}
              placeholder="Nguyễn Văn A"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3Identification;
