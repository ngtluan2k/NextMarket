import React from 'react';
import { SellerFormData } from '../../types';
import { Info, Mail, Upload, FileText, Edit, RotateCw, Trash2 } from 'lucide-react';

interface Step2BusinessInfoProps {
  formData: SellerFormData;
  emails: Array<{ id: number; email: string; is_default: boolean; description?: string }>;
  selectedDocFile: File | null;
  businessLicenseUrl: string;
  onInputChange: (field: string, value: any) => void;
  onShowEmailModal: () => void;
  onShowSelectEmailModal: () => void;
  onEditEmail: (email: any) => void;
  onSetDefaultEmail: (emailId: number) => void;
  onDeleteEmail: (emailId: number) => void;
  onDocFileChange: (file: File | null) => void;
}

const baseInput =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100';
const baseLabel = 'text-xs font-medium text-slate-700';
const actionBtn =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50';

const Step2BusinessInfo: React.FC<Step2BusinessInfoProps> = ({
  formData,
  emails,
  selectedDocFile,
  businessLicenseUrl,
  onInputChange,
  onShowEmailModal,
  onShowSelectEmailModal,
  onEditEmail,
  onSetDefaultEmail,
  onDeleteEmail,
  onDocFileChange,
}) => {
  const defaultEmail = emails.find((e) => e.is_default);

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-5 py-3">
        <h5 className="text-base font-semibold text-slate-800">Thông tin thuế</h5>
      </div>

      <div className="px-5 py-4">
        <div className="mb-3 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sky-800">
          <Info className="mt-0.5 h-4 w-4" />
          <p className="text-xs">
            <strong>Việc thu thập Thông Tin Thuế và Định Danh là bắt buộc.</strong> Người bán chịu
            trách nhiệm về tính chính xác của thông tin.
          </p>
        </div>

        {/* Loại hình kinh doanh */}
        <div className="mb-3">
          <h6 className="mb-1 text-xs font-semibold text-slate-800">Loại hình kinh doanh</h6>
          <div className="inline-flex rounded-lg bg-slate-100 p-1">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs">
              <input
                className="h-4 w-4 accent-sky-600"
                type="radio"
                name="businessType"
                value="company"
                checked={formData.store_information.type === 'company'}
                onChange={(e) => onInputChange('type', e.target.value)}
              />
              Hộ kinh doanh / Công ty
            </label>
          </div>
        </div>

        {/* Tên công ty */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className={`${baseLabel} mb-1 block`}>Tên công ty *</label>
            <input
              type="text"
              className={baseInput}
              value={formData.store_information.name}
              onChange={(e) => onInputChange('name', e.target.value)}
              placeholder="Nhập vào"
              maxLength={255}
              required
            />
            <small className="mt-1 block text-[11px] text-slate-500">0/255</small>
          </div>
        </div>

        {/* Địa chỉ đăng ký KD */}
        <div className="mt-3">
          <label className={`${baseLabel} mb-1 block`}>Địa chỉ đăng ký kinh doanh</label>
          <input
            type="text"
            className={baseInput}
            value={formData.store_information.addresses || ''}
            onChange={(e) => onInputChange('addresses', e.target.value)}
            placeholder="An Giang / Huyện An Phú / Thị Trấn An Phú"
          />
        </div>

        {/* Email hóa đơn */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <label className={baseLabel}>Email nhận hóa đơn điện tử</label>
            <button
              type="button"
              className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
              onClick={onShowEmailModal}
            >
              <Mail className="mr-2 h-4 w-4" />
              Thêm
            </button>
          </div>
          <div className="text-xs text-slate-500">
            {emails.length > 0 ? `${emails.length} email đã thêm` : 'Chưa có email'}
          </div>

          {emails.length > 0 && defaultEmail && (
            <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
              <div className="rounded-lg border border-slate-100 bg-white p-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1">
                    <div className="text-sky-700">
                      <span className="text-sm font-semibold">{defaultEmail.email}</span>
                    </div>
                    {defaultEmail.description && (
                      <div className="text-xs text-slate-500">{defaultEmail.description}</div>
                    )}
                    <span className="mt-1 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      Email mặc định
                    </span>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      className={actionBtn}
                      onClick={() => onEditEmail(defaultEmail)}
                      title="Chỉnh sửa email"
                    >
                      <Edit className="h-4 w-4" />
                      Cập nhật
                    </button>
                    {emails.length > 1 && (
                      <button
                        type="button"
                        className={actionBtn}
                        onClick={onShowSelectEmailModal}
                        title="Thay đổi email mặc định"
                      >
                        <RotateCw className="h-4 w-4" />
                        Thay đổi
                      </button>
                    )}
                    <button
                      type="button"
                      className={actionBtn}
                      onClick={() => onDeleteEmail(defaultEmail.id)}
                      title="Xóa email"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <p className="mt-1.5 text-xs text-slate-500">
            Hóa đơn điện tử sẽ được gửi đến email mặc định (tối đa 5 email)
          </p>
        </div>

        {/* Mã số thuế */}
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className={`${baseLabel} mb-1 block`}>Mã số thuế</label>
            <input
              type="text"
              className={baseInput}
              value={formData.store_information.tax_code || ''}
              onChange={(e) => onInputChange('tax_code', e.target.value)}
              placeholder="Nhập vào"
              maxLength={14}
            />
            <small className="mt-1 block text-[11px] text-slate-500">0/14</small>
          </div>
        </div>

        {/* Giấy phép */}
        <div className="mt-4">
          <label className={`${baseLabel} mb-1 block`}>Giấy phép đăng ký kinh doanh</label>
          <div className="mt-1.5 flex items-center gap-2.5">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              <span>Chọn file</span>
              <input
                type="file"
                accept="image/png, image/jpeg, application/pdf"
                onChange={(e) => onDocFileChange(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
            {selectedDocFile && (
              <span className="text-xs text-slate-600">{selectedDocFile.name}</span>
            )}
          </div>

          <p className="mt-1.5 text-xs text-slate-500">
            Hỗ trợ PDF/JPG/PNG, tối đa 10MB. File sẽ lưu với loại: BUSINESS_LICENSE.
          </p>

          {businessLicenseUrl && (
            <div className="mt-2">
              <div className="mb-1 text-[11px] text-slate-500">Xem nhanh Giấy phép:</div>
              {businessLicenseUrl.startsWith('/uploads') ? (
                /\.(png|jpe?g|webp|gif)$/i.test(businessLicenseUrl) ? (
                  <img
                    src={`http://localhost:3000${businessLicenseUrl}`}
                    alt="Business License"
                    className="max-h-52 max-w-xs rounded-lg border border-slate-100"
                  />
                ) : (
                  <a
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50"
                    href={`http://localhost:3000${businessLicenseUrl}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FileText className="h-4 w-4" />
                    Mở file
                  </a>
                )
              ) : (
                <img
                  src={businessLicenseUrl}
                  alt="Business License (local)"
                  className="max-h-52 max-w-xs rounded-lg border border-slate-100"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step2BusinessInfo;
