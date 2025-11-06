// Centralized validators for Auth (login/register)

export type RegisterPayload = {
  username: string;
  full_name: string;
  dob: string; // ISO yyyy-mm-dd (input[type="date"])
  phone: string;
  gender: string; // "male" | "female" | "other"
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

const FULLNAME_WORD_REGEX = /^[A-Za-zÀ-ỹĐđ'’-]+$/;

function isValidFullNameFE(name: string): boolean {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return false;
  return parts.every((p) => FULLNAME_WORD_REGEX.test(p));
}

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

const STRONG_PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,}$/;

export function validateLogin(data: LoginPayload): {
  ok: boolean;
  errors: FieldError<keyof LoginPayload>[];
} {
  const errors: FieldError<keyof LoginPayload>[] = [];
  const password = (data.password || '').trim();


  if (!EMAIL_REGEX.test(data.email || '')) {
    errors.push({ field: 'email', message: 'Email không hợp lệ' });
  }
  if (!STRONG_PASSWORD_REGEX.test(password)) {
    errors.push({
      field: 'password',
      message: 'Mật khẩu phải ≥8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt',
    });
  }

  return { ok: errors.length === 0, errors };
}

export function validateRegister(data: RegisterPayload): {
  ok: boolean;
  errors: FieldError<keyof RegisterPayload>[];
} {
  const errors: FieldError<keyof RegisterPayload>[] = [];

  // username
  if (!data.username || data.username.trim().length < 3) {
    errors.push({ field: 'username', message: 'Username tối thiểu 3 ký tự' });
  }

  // full_name
  if (!data.full_name || data.full_name.trim().length < 2) {
    errors.push({ field: 'full_name', message: 'Vui lòng nhập Họ và tên' });
  }

  if (data.full_name && data.full_name.trim().length >= 2) {
    const full = data.full_name.trim();
    if (!isValidFullNameFE(full)) {
      errors.push({
        field: 'full_name',
        message: 'Full name phải ít nhất 2 từ và không được rỗng',
      });
    }
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
  if (
    !['male', 'female', 'other'].includes((data.gender || '').toLowerCase())
  ) {
    errors.push({ field: 'gender', message: 'Vui lòng chọn giới tính' });
  }

  // email
  if (!EMAIL_REGEX.test(data.email || '')) {
    errors.push({ field: 'email', message: 'Email không hợp lệ' });
  }

  const pwd = (data.password || '').trim();
  if (!pwd) {
    errors.push({ field: 'password', message: 'Vui lòng nhập mật khẩu' });
  } else if (!STRONG_PASSWORD_REGEX.test(pwd)) {
    errors.push({
      field: 'password',
      message: 'Mật khẩu phải ≥8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt',
    });
  }

  // country
  if (!data.country || data.country.trim().length === 0) {
    errors.push({ field: 'country', message: 'Vui lòng chọn quốc gia' });
  }

  return { ok: errors.length === 0, errors };
}
