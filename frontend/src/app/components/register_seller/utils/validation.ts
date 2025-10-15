// src/seller-registration/utils/validation.ts
import { SellerFormData } from '../../types';

/** =========================
 *  PHONE (Vietnam) UTIL
 *  =========================
 *  Hợp lệ nếu:
 *   - 0xxxxxxxxx
 *   - +84xxxxxxxxx / 84xxxxxxxxx (không có số 0 ngay sau mã quốc gia)
 *   - hoặc chỉ 9–10 chữ số (không bắt đầu bằng 0) -> hiểu là "ngầm +84" (UI có prefix)
 *  Bỏ qua khoảng trắng, '-', '()', '.'
 */
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
 *  STEPS VALIDATION (wizard)
 *  ========================= */
export const validateStep1 = (formData: SellerFormData, addresses: any[]) => {
  const errors: string[] = [];

  if (!formData.name?.trim()) errors.push('Tên cửa hàng không được để trống');
  if (!formData.email?.trim()) errors.push('Email không được để trống');
  if (!formData.phone?.trim()) errors.push('Số điện thoại không được để trống');

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (formData.email && !emailRegex.test(formData.email)) {
    errors.push('Email không đúng định dạng');
  }

  // Phone (+84/84/0, hoặc 9–10 số ngầm +84)
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
      // Phone trong địa chỉ cũng cho phép "ngầm +84"
      const addrPhone = (defaultAddress as any).phone as string | undefined;
      if (addrPhone && !isValidVNPhone(addrPhone)) {
        errors.push('Số điện thoại ở địa chỉ không đúng định dạng');
      }
    }
  }

  return errors;
};

export const validateStep2 = (formData: SellerFormData, emails: any[]) => {
  const errors: string[] = [];

  if (!formData.store_information?.name?.trim()) {
    errors.push('Tên doanh nghiệp không được để trống');
  }

  if (!formData.store_information?.addresses?.trim()) {
    errors.push('Địa chỉ doanh nghiệp không được để trống');
  }

  // Email hóa đơn
  const defaultEmail = emails.find((e) => e.is_default);
  if (!defaultEmail || !defaultEmail.email?.trim()) {
    errors.push('Vui lòng thêm email hóa đơn');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(defaultEmail.email)) {
      errors.push('Email hóa đơn không đúng định dạng');
    }
  }

  return errors;
};

export const validateStep3 = (formData: SellerFormData) => {
  const errors: string[] = [];

  // Tài khoản ngân hàng (nếu có nhập thì phải đủ)
  if (
    formData.bank_account?.bank_name ||
    formData.bank_account?.account_number ||
    formData.bank_account?.account_holder
  ) {
    if (!formData.bank_account.bank_name?.trim()) {
      errors.push('Tên ngân hàng không được để trống');
    }
    if (!formData.bank_account.account_number?.trim()) {
      errors.push('Số tài khoản không được để trống');
    }
    if (!formData.bank_account.account_holder?.trim()) {
      errors.push('Tên chủ tài khoản không được để trống');
    }
  }

  // Định danh (tùy chọn, nếu nhập thì phải có họ tên)
  if (
    formData.store_identification?.full_name ||
    formData.store_identification?.img_front ||
    formData.store_identification?.img_back
  ) {
    if (!formData.store_identification.full_name?.trim()) {
      errors.push('Họ tên trong thông tin định danh không được để trống');
    }
  }

  return errors;
};
