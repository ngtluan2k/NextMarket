import React, { useImperativeHandle } from "react";
import { SellerFormData } from "../../types";
import {
  Info,
  Mail,
  Upload,
  FileText,
  Edit,
  RotateCw,
  Trash2,
} from "lucide-react";
import {
  validateBusinessName,
  validateBusinessAddresses,
  validateDefaultInvoiceEmail,
  validateTaxCode,
  validateBusinessLicenseFile,
} from "../utils/validation";
import SelectEmailModal from "../components/SelectEmailModal"; // ✅ Modal chọn email

export type Step2BusinessInfoHandle = {
  validateAll: () => boolean;
  clearErrors: () => void;
};

interface Step2BusinessInfoProps {
  formData: SellerFormData;
  emails: Array<{
    id: number;
    email: string;
    is_default: boolean;
    description?: string;
  }>;
  selectedDocFile: File | null;
  businessLicenseUrl: string;
  onInputChange: (field: string, value: any) => void;
  onShowEmailModal: () => void;
  onEditEmail: (email: any) => void;
  onSetDefaultEmail: (emailId: number) => void;
  onDeleteEmail: (emailId: number) => void;
  onDocFileChange: (file: File | null) => void;
}

const baseInput =
  "w-full rounded-xl border bg-white px-3 py-1.5 outline-none transition focus:ring-4";
const baseLabel = "text-[11px] font-medium text-slate-700";
const ok = "border-slate-200 focus:border-sky-500 focus:ring-sky-100";
const er = "border-rose-300 focus:border-rose-500 focus:ring-rose-100";
const withErr = (b: boolean) => `${baseInput} ${b ? er : ok}`;
const actionBtn =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50";

const Step2BusinessInfo = React.forwardRef<
  Step2BusinessInfoHandle,
  Step2BusinessInfoProps
>((props, ref) => {
  const {
    formData,
    emails,
    selectedDocFile,
    businessLicenseUrl,
    onInputChange,
    onShowEmailModal,
    onEditEmail,
    onSetDefaultEmail,
    onDeleteEmail,
    onDocFileChange,
  } = props;

  const [showSelectEmail, setShowSelectEmail] = React.useState(false);
  const defaultEmail = emails.find((e) => e.is_default);

  const [errors, setErrors] = React.useState<{
    name?: string;
    addresses?: string;
    defaultEmail?: string;
    tax_code?: string;
    docFile?: string;
  }>({});

  const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

  const run = {
    name: () => validateBusinessName(formData.store_information?.name),
    addresses: () =>
      validateBusinessAddresses(formData.store_information?.addresses),
    defaultEmail: () => validateDefaultInvoiceEmail(emails),
    tax_code: () =>
      validateTaxCode(
        formData.store_information?.type,
        formData.store_information?.tax_code
      ),
    docFile: () =>
      validateBusinessLicenseFile(
        selectedDocFile,
        formData.store_information?.type === "company"
      ),
  };

  const handleBlur = (f: keyof typeof run) =>
    setErrors((p) => ({ ...p, [f]: run[f]() }));

  React.useEffect(() => {
    setErrors((p) => ({ ...p, defaultEmail: run.defaultEmail() }));
  }, [emails.length, defaultEmail?.id, defaultEmail?.email]);

  React.useEffect(() => {
    setErrors((p) => ({ ...p, docFile: run.docFile() }));
  }, [selectedDocFile]);

  React.useEffect(() => {
    setErrors((p) => ({ ...p, tax_code: run.tax_code() }));
  }, [formData.store_information?.type]);

  const validateAll = () => {
    const next = {
      name: run.name(),
      addresses: run.addresses(),
      defaultEmail: run.defaultEmail(),
      tax_code: run.tax_code(),
      docFile: run.docFile(),
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
    [formData, emails, selectedDocFile]
  );

  return (
    <>
      <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center gap-2">
          <Info className="h-5 w-5 text-sky-700" />
          <h5 className="text-base font-semibold text-slate-800">
            Thông tin thuế
          </h5>
        </div>

        <div className="px-5 py-4">
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sky-800">
            <Info className="mt-0.5 h-4 w-4" />
            <p className="text-xs">
              <strong>Bắt buộc.</strong> Người bán chịu trách nhiệm về tính chính
              xác của thông tin.
            </p>
          </div>

          {/* Loại hình */}
          <div className="mb-3">
            <h6 className="mb-1 text-xs font-semibold text-slate-800">
              Loại hình kinh doanh
            </h6>
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              {(["individual", "company"] as const).map((t) => (
                <label
                  key={t}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md px-3 py-1.5 text-xs"
                >
                  <input
                    className="h-4 w-4 accent-sky-600"
                    type="radio"
                    name="businessType"
                    value={t}
                    checked={formData.store_information.type === t}
                    onChange={(e) => onInputChange("type", e.target.value)}
                  />
                  {t === "individual"
                    ? "Cá nhân / Hộ kinh doanh"
                    : "Công ty / Doanh nghiệp"}
                </label>
              ))}
            </div>
          </div>

          {/* Tên công ty */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className={`${baseLabel} mb-1 block`}>Tên công ty *</label>
              <input
                className={withErr(!!errors.name)}
                value={formData.store_information.name}
                onBlur={() => handleBlur("name")}
                onChange={(e) => onInputChange("name", e.target.value)}
                placeholder="Nhập vào"
                maxLength={255}
              />
              {errors.name ? (
                <p className="mt-1 text-[11px] text-rose-600">{errors.name}</p>
              ) : (
                <small className="mt-1 block text-[11px] text-slate-500">
                  {(formData.store_information.name || "").length}/255
                </small>
              )}
            </div>
          </div>

          {/* Địa chỉ KD */}
          <div className="mt-3">
            <label className={`${baseLabel} mb-1 block`}>
              Địa chỉ đăng ký kinh doanh *
            </label>
            <input
              className={withErr(!!errors.addresses)}
              value={formData.store_information.addresses || ""}
              onBlur={() => handleBlur("addresses")}
              onChange={(e) => onInputChange("addresses", e.target.value)}
              placeholder="An Giang / Huyện An Phú / Thị Trấn An Phú"
            />
            {errors.addresses && (
              <p className="mt-1 text-[11px] text-rose-600">
                {errors.addresses}
              </p>
            )}
          </div>

          {/* Email hóa đơn */}
          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <label className={baseLabel}>Email nhận hóa đơn điện tử *</label>
              <button
                type="button"
                className="inline-flex items-center rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                onClick={onShowEmailModal}
              >
                <Mail className="mr-2 h-4 w-4" /> Thêm
              </button>
            </div>

            {errors.defaultEmail && (
              <p className="mb-1 text-[11px] text-rose-600">
                {errors.defaultEmail}
              </p>
            )}
            <div className="text-xs text-slate-500">
              {emails.length > 0
                ? `${emails.length} email đã thêm`
                : "Chưa có email"}
            </div>

            {emails.length > 0 && defaultEmail && (
              <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                <div className="rounded-lg border border-slate-100 bg-white p-3">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <div className="text-sky-700">
                        <span className="text-sm font-semibold">
                          {defaultEmail.email}
                        </span>
                      </div>
                      <span className="mt-1 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        Email mặc định
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        className={actionBtn}
                        onClick={() => onEditEmail(defaultEmail)}
                      >
                        <Edit className="h-4 w-4" /> Cập nhật
                      </button>
                      {emails.length >= 1 && (
                        <button
                          type="button"
                          className={actionBtn}
                          onClick={() => setShowSelectEmail(true)}
                        >
                          <RotateCw className="h-4 w-4" /> Thay đổi
                        </button>
                      )}
                      <button
                        type="button"
                        className={actionBtn}
                        onClick={() => onDeleteEmail(defaultEmail.id)}
                      >
                        <Trash2 className="h-4 w-4" /> Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <p className="mt-1.5 text-xs text-slate-500">
              Hóa đơn điện tử sẽ gửi đến email mặc định (tối đa 5 email)
            </p>
          </div>

          {/* MST */}
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className={`${baseLabel} mb-1 block`}>
                Mã số thuế{" "}
                {formData.store_information.type === "company" && (
                  <span className="text-rose-500">*</span>
                )}
              </label>
              <input
                inputMode="numeric"
                className={withErr(!!errors.tax_code)}
                value={formData.store_information.tax_code || ""}
                onBlur={() => handleBlur("tax_code")}
                onChange={(e) =>
                  onInputChange("tax_code", onlyDigits(e.target.value).slice(0, 14))
                }
                maxLength={14}
              />
              {errors.tax_code ? (
                <p className="mt-1 text-[11px] text-rose-600">
                  {errors.tax_code}
                </p>
              ) : (
                <small className="mt-1 block text-[11px] text-slate-500">
                  {(formData.store_information.tax_code || "").length}/14
                </small>
              )}
            </div>
          </div>

          {/* Giấy phép */}
          <div className="mt-4">
            <label className={`${baseLabel} mb-1 block`}>
              Giấy phép đăng ký kinh doanh
            </label>
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
                <span className="text-xs text-slate-600">
                  {selectedDocFile.name}
                </span>
              )}
            </div>
            {errors.docFile && (
              <p className="mt-1 text-[11px] text-rose-600">{errors.docFile}</p>
            )}
            <p className="mt-1.5 text-xs text-slate-500">
              Hỗ trợ PDF/JPG/PNG, tối đa 10MB. File lưu với loại:
              BUSINESS_LICENSE.
            </p>

            {businessLicenseUrl && (
              <div className="mt-2">
                <div className="mb-1 text-[11px] text-slate-500">Xem nhanh:</div>
                {businessLicenseUrl.startsWith("/uploads") ? (
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
                      <FileText className="h-4 w-4" /> Mở file
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

      <SelectEmailModal
        open={showSelectEmail}
        emails={emails}
        onClose={() => setShowSelectEmail(false)}
        onSelect={(id) => {
          onSetDefaultEmail(id);
          setShowSelectEmail(false);
        }}
      />
    </>
  );
});

Step2BusinessInfo.displayName = "Step2BusinessInfo";
export default Step2BusinessInfo;
