// Centralized validators for Auth (login/register)

export type RegisterPayload = {
    username: string;
    full_name: string;
    dob: string;        // ISO yyyy-mm-dd (input[type="date"])
    phone: string;
    gender: string;     // "male" | "female" | "other"
    email: string;
    country: string;
    password: string;
  };
  
  export type LoginPayload = {
    email: string;
    password: string;
  };
  
  type FieldError<TField extends string> = {
    field: TField;
    message: string;
  };
  
  const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
  // VN phone (9–11 digits). Điều chỉnh theo backend nếu cần.
  const PHONE_REGEX = /^(?:0|\+?84)?[1-9]\d{7,10}$/;
  
  function calcAge(dob: string): number | null {
    if (!dob) return null;
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - d.getFullYear();
    const m = today.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
    return age;
  }
  
  export function validateLogin(
    data: LoginPayload
  ): { ok: boolean; errors: FieldError<keyof LoginPayload>[] } {
    const errors: FieldError<keyof LoginPayload>[] = [];
  
    if (!EMAIL_REGEX.test(data.email || '')) {
      errors.push({ field: 'email', message: 'Email không hợp lệ' });
    }
    if ((data.password || '').length < 6) {
      errors.push({ field: 'password', message: 'Mật khẩu tối thiểu 6 ký tự' });
    }
  
    return { ok: errors.length === 0, errors };
  }
  
  export function validateRegister(
    data: RegisterPayload
  ): { ok: boolean; errors: FieldError<keyof RegisterPayload>[] } {
    const errors: FieldError<keyof RegisterPayload>[] = [];
  
    // username
    if (!data.username || data.username.trim().length < 3) {
      errors.push({ field: 'username', message: 'Username tối thiểu 3 ký tự' });
    }
  
    // full_name
    if (!data.full_name || data.full_name.trim().length < 2) {
      errors.push({ field: 'full_name', message: 'Vui lòng nhập Họ và tên' });
    }
  
    // dob (>= 14 tuổi)
    if (!data.dob) {
      errors.push({ field: 'dob', message: 'Vui lòng chọn ngày sinh' });
    } else {
      const age = calcAge(data.dob);
      if (age === null) {
        errors.push({ field: 'dob', message: 'Ngày sinh không hợp lệ' });
      } else if (age < 14) {
        errors.push({ field: 'dob', message: 'Bạn phải đủ 14 tuổi trở lên' });
      }
    }
  
    // phone
    if (!data.phone) {
      errors.push({ field: 'phone', message: 'Vui lòng nhập SĐT' });
    } else if (!PHONE_REGEX.test(data.phone)) {
      errors.push({ field: 'phone', message: 'SĐT không hợp lệ' });
    }
  
    // gender
    if (!['male', 'female', 'other'].includes((data.gender || '').toLowerCase())) {
      errors.push({ field: 'gender', message: 'Vui lòng chọn giới tính' });
    }
  
    // email
    if (!EMAIL_REGEX.test(data.email || '')) {
      errors.push({ field: 'email', message: 'Email không hợp lệ' });
    }
  
    // password
    if (!data.password || data.password.length < 6) {
      errors.push({ field: 'password', message: 'Mật khẩu tối thiểu 6 ký tự' });
    }
  
    // country
    if (!data.country || data.country.trim().length === 0) {
      errors.push({ field: 'country', message: 'Vui lòng chọn quốc gia' });
    }
  
    return { ok: errors.length === 0, errors };
  }
  