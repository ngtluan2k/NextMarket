// frontend/src/app/page/OtpVerify.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { requestRegisterOtp, verifyRegisterOtp } from '../../service/auth.service';
import type { VerifyRegisterPayload } from '../../service/auth.service';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function OtpVerifyPage() {
  const navigate = useNavigate();
  const query = useQuery();
  const emailFromQuery = query.get('email') || '';
  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Lấy payload đăng ký đã lưu tạm ở sessionStorage
  const saved: Omit<VerifyRegisterPayload, 'code'> | null = (() => {
    try {
      const raw = sessionStorage.getItem('pendingRegister');
      return raw ? (JSON.parse(raw) as Omit<VerifyRegisterPayload, 'code'>) : null;
    } catch {
      return null;
    }
  })();

  useEffect(() => {
    if (!saved || !saved.email) {
      // không có payload -> quay lại trang chủ/đăng ký
      navigate('/', { replace: true });
    } else {
      setEmail(saved.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const resend = async () => {
    try {
      setError(null);
      if (!email) throw new Error('Thiếu email để gửi lại OTP');
      await requestRegisterOtp(email);
      setCooldown(60);
    } catch (e: any) {
      setError(e?.message || 'Không thể gửi lại OTP');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saved) return;
    if (!/^\d{6}$/.test(otp.trim())) {
      setError('Mã OTP phải gồm 6 chữ số');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await verifyRegisterOtp({ ...saved, code: otp.trim() });
      sessionStorage.removeItem('pendingRegister');
      navigate('/account', { replace: true }); // hoặc điều hướng tuỳ ý
    } catch (e: any) {
      setError(e?.message || 'Xác thực OTP thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-6 shadow">
        <h1 className="text-xl font-semibold text-slate-900">Xác thực email</h1>
        <p className="mt-1 text-sm text-slate-600">
          Nhập mã OTP đã gửi tới <b>{email}</b>. Kiểm tra cả thư mục Spam.
        </p>

        {error && (
          <div className="mt-3 rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-4">
          <label className="mb-1 block text-sm font-medium text-slate-700">Mã OTP</label>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Nhập mã 6 số"
            inputMode="numeric"
            maxLength={6}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
            <span>Chưa nhận được mã?</span>
            <button
              type="button"
              onClick={resend}
              disabled={cooldown > 0}
              className={`font-medium ${cooldown > 0 ? 'text-slate-400' : 'text-sky-600 hover:underline'}`}
            >
              {cooldown > 0 ? `Gửi lại sau ${cooldown}s` : 'Gửi lại OTP'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-5 w-full rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
        >
          {submitting ? 'Đang xác thực...' : 'Xác nhận & Tạo tài khoản'}
        </button>

        <div className="mt-4 text-center text-xs text-slate-500">
          Sai email? <Link to="/" className="text-sky-600 hover:underline">Quay lại</Link>
        </div>
      </form>
    </div>
  );
}