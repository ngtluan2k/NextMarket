import React from 'react';
import { SellerFormData } from '../../types';
import { CheckCircle2 } from 'lucide-react';

interface Step4ConfirmationProps {
  formData: SellerFormData;
  loading: boolean;
  onFinalSubmit: () => void;
}

const Step4Confirmation: React.FC<Step4ConfirmationProps> = ({ formData, loading, onFinalSubmit }) => {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3">
        <h5 className="text-base font-semibold text-slate-800">Hoàn tất đăng ký</h5>
      </div>

      <div className="px-5 py-6 text-center">
        <h4 className="text-lg font-semibold text-slate-800">Xác nhận thông tin đăng ký</h4>
        <p className="mt-1 text-sm text-slate-500">Vui lòng kiểm tra lại thông tin trước khi hoàn tất</p>

        <div className="mx-auto mt-4 max-w-2xl text-left space-y-3">
          <div>
            <h6 className="text-xs font-semibold text-slate-800">Thông tin Shop:</h6>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
              <li>Tên shop: {formData.name}</li>
              <li>Email: {formData.email}</li>
              <li>Số điện thoại: {formData.phone}</li>
            </ul>
          </div>
          <div>
            <h6 className="text-xs font-semibold text-slate-800">Thông tin kinh doanh:</h6>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
              <li>Loại hình: {formData.store_information.type === 'individual' ? 'Cá nhân' : 'Công ty'}</li>
              <li>Tên: {formData.store_information.name}</li>
              <li>Mã số thuế: {formData.store_information.tax_code || '—'}</li>
            </ul>
          </div>
          <div>
            <h6 className="text-xs font-semibold text-slate-800">Thông tin ngân hàng:</h6>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
              <li>Ngân hàng: {formData.bank_account.bank_name}</li>
              <li>Số tài khoản: {formData.bank_account.account_number}</li>
              <li>Chủ tài khoản: {formData.bank_account.account_holder}</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button className="inline-flex items-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60" onClick={onFinalSubmit} disabled={loading}>
            <CheckCircle2 className="mr-2 h-5 w-5" /> {loading ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step4Confirmation;
