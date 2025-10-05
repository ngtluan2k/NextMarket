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

const Step3Identification: React.FC<Step3IdentificationProps> = ({
  formData,
  onInputChange,
  onBankAccountChange,
  onFileSelected,
  frontFile,
  backFile,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h5>🪪 Thông tin định danh</h5>
      </div>
      <div className="card-body">
        {/* Định danh */}
        <div className="mb-4">
          <h6>Thông tin định danh</h6>
          <div className="mb-3">
            <label className="form-label">Loại giấy tờ *</label>
            <select
              className="form-select"
              value={formData.store_identification.type}
              onChange={(e) => onInputChange('type', e.target.value)}
              required
            >
              <option value="CCCD">Căn cước công dân</option>
            </select>

            <CCCDUpload
              onFileSelected={onFileSelected}
              frontFile={frontFile}
              backFile={backFile}
              className="mt-3"
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Họ tên đầy đủ *</label>
            <input
              type="text"
              className="form-control"
              value={formData.store_identification.full_name}
              onChange={(e) => onInputChange('full_name', e.target.value)}
              placeholder="Nhập họ tên đầy đủ"
              required
            />
          </div>
        </div>

        {/* Ngân hàng */}
        <div className="mb-4">
          <h6>Thông tin tài khoản ngân hàng</h6>
          <div className="row">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Tên ngân hàng *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.bank_account.bank_name}
                  onChange={(e) =>
                    onBankAccountChange('bank_name', e.target.value)
                  }
                  placeholder="Vietcombank"
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Số tài khoản *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.bank_account.account_number}
                  onChange={(e) =>
                    onBankAccountChange('account_number', e.target.value)
                  }
                  placeholder="1234567890"
                  required
                />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Chủ tài khoản *</label>
            <input
              type="text"
              className="form-control"
              value={formData.bank_account.account_holder}
              onChange={(e) =>
                onBankAccountChange('account_holder', e.target.value)
              }
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
