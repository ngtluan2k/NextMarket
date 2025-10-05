// frontend/src/service/auth.service.ts
const API_BASE = 'http://localhost:3000';

export async function requestRegisterOtp(email: string) {
  const res = await fetch(`${API_BASE}/users/register/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || 'Gửi OTP thất bại');
  return data as { message: string; debugCode?: string };
}

export type VerifyRegisterPayload = {
  username: string;
  full_name: string;
  dob: string;
  phone: string;
  gender: string;
  email: string;
  password: string;
  country?: string;
  code: string;
};

export async function verifyRegisterOtp(payload: VerifyRegisterPayload) {
  const res = await fetch(`${API_BASE}/users/register/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data as any)?.error)
    throw new Error((data as any)?.message || 'Xác thực OTP thất bại');
  return data;
}
