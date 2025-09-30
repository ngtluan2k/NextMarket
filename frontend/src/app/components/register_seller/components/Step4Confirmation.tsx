import React from 'react';
import { SellerFormData } from '../../types';

interface Step4ConfirmationProps {
  formData: SellerFormData;
  loading: boolean;
  onFinalSubmit: () => void;
}

const Step4Confirmation: React.FC<Step4ConfirmationProps> = ({
  formData,
  loading,
  onFinalSubmit,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h5>✅ Hoàn tất đăng ký</h5>
      </div>
      <div className="card-body text-center">
        <h4>Xác nhận thông tin đăng ký</h4>
        <p className="text-muted">
          Vui lòng kiểm tra lại thông tin trước khi hoàn tất đăng ký
        </p>

        <div className="text-start mt-4">
          <h6>Thông tin Shop:</h6>
          <ul>
            <li>Tên shop: {formData.name}</li>
            <li>Email: {formData.email}</li>
            <li>Số điện thoại: {formData.phone}</li>
          </ul>

          <h6>Thông tin kinh doanh:</h6>
          <ul>
            <li>
              Loại hình:{' '}
              {formData.store_information.type === 'individual'
                ? 'Cá nhân'
                : 'Công ty'}
            </li>
            <li>Tên: {formData.store_information.name}</li>
            <li>Mã số thuế: {formData.store_information.tax_code}</li>
          </ul>

          <h6>Thông tin ngân hàng:</h6>
          <ul>
            <li>Ngân hàng: {formData.bank_account.bank_name}</li>
            <li>Số tài khoản: {formData.bank_account.account_number}</li>
            <li>Chủ tài khoản: {formData.bank_account.account_holder}</li>
          </ul>
        </div>

        <div className="d-flex gap-3 justify-content-center mt-4">
          <button
            className="btn btn-success btn-lg"
            onClick={onFinalSubmit}
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : '✅ Hoàn tất đăng ký'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step4Confirmation;
