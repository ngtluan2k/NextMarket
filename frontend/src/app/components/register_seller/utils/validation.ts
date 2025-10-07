import { SellerFormData } from '../../types';

export const validateStep1 = (formData: SellerFormData, addresses: any[]) => {
  const errors: string[] = [];

  if (!formData.name?.trim()) errors.push('Tên cửa hàng không được để trống');
  if (!formData.email?.trim()) errors.push('Email không được để trống');
  if (!formData.phone?.trim()) errors.push('Số điện thoại không được để trống');

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (formData.email && !emailRegex.test(formData.email)) {
    errors.push('Email không đúng định dạng');
  }

  // Validate phone format (Vietnamese)
  const phoneRegex = /^(\+84|84|0)[1-9][0-9]{8,9}$/;
  if (formData.phone && !phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
    errors.push('Số điện thoại không đúng định dạng');
  }

  // Validate address
  const defaultAddress = addresses.find((a) => a.is_default);
  if (!defaultAddress) {
    errors.push('Vui lòng thêm ít nhất một địa chỉ');
  } else {
    // Chuẩn: district có thể không bắt buộc (V2). Các trường còn lại bắt buộc
    const requiredFields = [
      'recipient_name',
      'phone',
      'street',
      'province',
      'postal_code',
    ];
    const missingFields = requiredFields.filter(
      (field) => !(defaultAddress as any)[field]?.trim()
    );
    if (missingFields.length > 0) {
      errors.push('Vui lòng điền đầy đủ thông tin địa chỉ');
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

  // Validate email for invoice
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

  // Bank account validation
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

  // Identification validation (optional but if filled, must be complete)
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
