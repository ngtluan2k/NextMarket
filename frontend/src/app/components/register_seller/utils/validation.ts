import { SellerFormData } from '../../types';
type Step3Files = { front?: File | null; back?: File | null };


export const isValidVNPhone = (raw?: string) => {
  if (!raw) return false;
  const s = raw.trim().replace(/[\s\-().]/g, '');

  // UI có prefix riêng (+84), người dùng chỉ nhập 9–10 số
  if (/^[1-9]\d{8,9}$/.test(s)) return true;

  if (s.startsWith('+84')) return /^\+84[1-9]\d{8,9}$/.test(s);
  if (s.startsWith('84'))  return /^84[1-9]\d{8,9}$/.test(s);
  if (s.startsWith('0'))   return /^0[1-9]\d{8,9}$/.test(s);
  return false;
};

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** =========================
 *  ADDRESS MODAL VALIDATION
 *  ========================= */
export type AddressField =
  | 'recipient_name'
  | 'phone'
  | 'street'
  | 'province'
  | 'district'
  | 'ward'
  | 'postal_code'
  | 'country';

export interface AddressValidationCtx {
  /** V2: district KHÔNG bắt buộc, V1: bắt buộc */
  isV2: boolean;
  /** Các code chọn từ hook useProvinces */
  provinceCode?: number | null;
  districtCode?: number | null;
  wardCode?: number | null;
}

/** Validate 1 field (trả về chuỗi lỗi; '' nếu hợp lệ) */
export const validateAddressField = (
  formData: Record<string, any>,
  field: AddressField,
  ctx: AddressValidationCtx
): string => {
  const v = formData?.[field];

  switch (field) {
    case 'recipient_name':
      if (!String(v ?? '').trim()) return 'Vui lòng nhập tên người nhận';
      return '';
    case 'phone':
      if (!String(v ?? '').trim()) return 'Vui lòng nhập số điện thoại';
      if (!isValidVNPhone(v)) return 'Số điện thoại không đúng định dạng';
      return '';
    case 'street':
      if (!String(v ?? '').trim()) return 'Vui lòng nhập địa chỉ đường phố';
      return '';
    case 'province':
      if (!ctx.provinceCode) return 'Vui lòng chọn tỉnh/thành phố';
      return '';
    case 'district':
      if (!ctx.isV2 && !ctx.districtCode) return 'Vui lòng chọn quận/huyện';
      return '';
    case 'ward':
      if (!ctx.wardCode) return 'Vui lòng chọn phường/xã';
      return '';
    case 'postal_code': {
      const s = String(v ?? '').trim();
      if (!s) return 'Vui lòng nhập mã bưu điện';
      if (!/^\d{5,6}$/.test(s)) return 'Mã bưu điện phải gồm 5–6 chữ số';
      return '';
    }
    case 'country':
      if (!String(v ?? '').trim()) return 'Vui lòng nhập quốc gia';
      return '';
    default:
      return '';
  }
};

/** Validate toàn form địa chỉ (trả về object lỗi { field: message }) */
export const validateAddressForm = (
  formData: Record<string, any>,
  ctx: AddressValidationCtx
): Partial<Record<AddressField, string>> => {
  const fields: AddressField[] = [
    'recipient_name',
    'phone',
    'street',
    'province',
    ...(ctx.isV2 ? [] : (['district'] as AddressField[])),
    'ward',
    'postal_code',
    'country',
  ];

  const errs: Partial<Record<AddressField, string>> = {};
  fields.forEach((f) => {
    const msg = validateAddressField(formData, f, ctx);
    if (msg) errs[f] = msg;
  });
  return errs;
};

/** =========================
 *  STEP 1 VALIDATION
 *  ========================= */
export const validateStep1 = (formData: SellerFormData, addresses: any[]) => {
  const errors: string[] = [];

  if (!formData.name?.trim()) errors.push('Tên cửa hàng không được để trống');
  if (!formData.email?.trim()) errors.push('Email không được để trống');
  if (!formData.phone?.trim()) errors.push('Số điện thoại không được để trống');

  if (formData.email && !emailRegex.test(formData.email)) {
    errors.push('Email không đúng định dạng');
  }

  if (formData.phone && !isValidVNPhone(formData.phone)) {
    errors.push('Số điện thoại không đúng định dạng');
  }

  // Địa chỉ mặc định
  const defaultAddress = addresses.find((a) => a.is_default);
  if (!defaultAddress) {
    errors.push('Vui lòng thêm ít nhất một địa chỉ');
  } else {
    const requiredFields = ['recipient_name', 'phone', 'street', 'province', 'postal_code'] as const;
    const missingFields = requiredFields.filter(
      (field) => !(defaultAddress as any)[field]?.toString().trim()
    );
    if (missingFields.length > 0) {
      errors.push('Vui lòng điền đầy đủ thông tin địa chỉ');
    } else {
      const addrPhone = (defaultAddress as any).phone as string | undefined;
      if (addrPhone && !isValidVNPhone(addrPhone)) {
        errors.push('Số điện thoại ở địa chỉ không đúng định dạng');
      }
    }
  }

  return errors;
};

/** =========================
 *  STEP 2 – field validators
 *  ========================= */
export const validateBusinessName = (name?: string) => {
  const v = (name || '').trim();
  return v ? '' : 'Vui lòng nhập tên công ty/doanh nghiệp';
};

export const validateBusinessAddresses = (addresses?: string) => {
  const v = (addresses || '').trim();
  return v ? '' : 'Vui lòng nhập địa chỉ đăng ký kinh doanh';
};

export const validateDefaultInvoiceEmail = (
  emails: Array<{ email: string; is_default: boolean }>
) => {
  const def = emails.find((e) => e.is_default);
  if (!def?.email?.trim()) return 'Vui lòng thêm email hóa đơn mặc định';
  if (!emailRegex.test(def.email)) return 'Email hóa đơn không đúng định dạng';
  return '';
};

/** MST:
 *  - Bắt buộc nếu type === 'company'
 *  - Hợp lệ: 10 số | 13 số | 10-3 (chi nhánh)
 *  - Nếu type !== 'company': không bắt buộc; nếu có nhập thì phải đúng định dạng
 */
export const validateTaxCode = (type?: string, taxCode?: string) => {
  const v = (taxCode || '').trim();
  const RE = /^(\d{10}|\d{13}|\d{10}-\d{3})$/;

  if (type === 'company') {
    if (!v) return 'Vui lòng nhập mã số thuế';
    if (!RE.test(v)) return 'Mã số thuế không đúng định dạng (10 số / 13 số / 10-3)';
  } else {
    if (v && !RE.test(v)) return 'Mã số thuế không đúng định dạng';
  }
  return '';
};

/** File giấy phép:
 *  - requiredWhenCompany = true → bắt buộc khi type = company
 *  - Chấp nhận: pdf, jpg, jpeg, png; size <= 10MB
 */
export const validateBusinessLicenseFile = (
  file: File | null,
  requiredWhenCompany: boolean
) => {
  if (requiredWhenCompany && !file) return 'Vui lòng tải lên Giấy phép đăng ký kinh doanh';

  if (file) {
    const okType = ['application/pdf', 'image/png', 'image/jpeg'].includes(file.type);
    if (!okType) return 'Định dạng file không hợp lệ (chỉ PDF/JPG/PNG)';
    const MAX = 10 * 1024 * 1024;
    if (file.size > MAX) return 'Kích thước file tối đa 10MB';
  }
  return '';
};

/** Tổng hợp Step 2 cho nút "Tiếp theo" */
export const validateStep2 = (
  formData: SellerFormData,
  emails: any[],
  selectedDocFile: File | null
) => {
  const errors: string[] = [];

  const m1 = validateBusinessName(formData.store_information?.name);
  if (m1) errors.push(m1);

  const m2 = validateBusinessAddresses(formData.store_information?.addresses);
  if (m2) errors.push(m2);

  const m3 = validateDefaultInvoiceEmail(emails);
  if (m3) errors.push(m3);

  const m4 = validateTaxCode(formData.store_information?.type, formData.store_information?.tax_code);
  if (m4) errors.push(m4);

  const m5 = validateBusinessLicenseFile(
    selectedDocFile,
    formData.store_information?.type === 'company'
  );
  if (m5) errors.push(m5);

  return errors;
};

export const validateStep3 = (formData: SellerFormData, files?: Step3Files) => {
  const errors: string[] = [];

  const fullName = (formData.store_identification.full_name || '').trim();

  // coi như đã có ảnh nếu có URL trong formData HOẶC có file vừa chọn
  const hasFront = !!formData.store_identification.img_front || !!files?.front;
  const hasBack  = !!formData.store_identification.img_back  || !!files?.back;

  // rule ảnh: yêu cầu cả 2 mặt
  if (!hasFront) errors.push('Vui lòng tải lên ảnh CCCD mặt trước');
  if (!hasBack)  errors.push('Vui lòng tải lên ảnh CCCD mặt sau');

  // nếu có bất kỳ thông tin định danh (ảnh/họ tên) thì họ tên bắt buộc
  const hasAnyID = hasFront || hasBack || !!fullName;
  if (hasAnyID && !fullName) {
    errors.push('Họ tên trong thông tin định danh không được để trống');
  }

  // ngân hàng: nếu điền 1 trong 3 thì phải đủ cả 3
  const bank = formData.bank_account || ({} as any);
  const hasAnyBank = !!(bank.bank_name || bank.account_number || bank.account_holder);

  if (hasAnyBank) {
    if (!String(bank.bank_name || '').trim()) errors.push('Tên ngân hàng không được để trống');
    if (!String(bank.account_number || '').trim())
      errors.push('Số tài khoản không được để trống');
    else if (!/^\d{6,20}$/.test(String(bank.account_number).trim()))
      errors.push('Số tài khoản chỉ gồm số (6–20 ký tự)');
    if (!String(bank.account_holder || '').trim())
      errors.push('Tên chủ tài khoản không được để trống');
  }

  return errors;
};