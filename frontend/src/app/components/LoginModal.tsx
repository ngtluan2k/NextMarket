// src/components/LoginModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Mail, Lock, User, Calendar, Phone, BadgeCheck, Eye, EyeOff, Globe } from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { requestRegisterOtp, requestPasswordOtp, verifyPasswordOtp } from '../../service/auth.service'; // UPDATED
import {
  validateLogin as validateLoginPayload,
  validateRegister as validateRegisterPayload,
} from '../../validation/auth.validation';
import ForgotPasswordModal from './ForgotPasswordModal';

export type LoginPayload = { email: string; password: string };
export type RegisterPayload = {
  username: string;
  full_name: string;
  dob: string;
  phone: string;
  gender: string;
  email: string;
  country: string;
  password: string;
};

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onLogin?: (data: LoginPayload) => Promise<void> | void;
  onRegister?: (data: RegisterPayload) => Promise<void> | void;
  title?: string;
  sideImageUrl?: string;
  apiBase?: string;
  onSuccess?: () => void;
};

const defaultSide =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='560' height='560'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0' stop-color='#eff6ff'/>
          <stop offset='1' stop-color='#e0f2fe'/>
        </linearGradient>
      </defs>
      <rect width='100%' height='100%' rx='28' fill='url(#g)'/>
      <g transform='translate(120,150)'>
        <rect x='0' y='20' rx='16' width='200' height='40' fill='#60a5fa'/>
        <rect x='220' y='0' rx='16' width='200' height='60' fill='#38bdf8'/>
        <circle cx='100' cy='160' r='76' fill='#0ea5e9' opacity='.9'/>
        <rect x='220' y='120' rx='16' width='180' height='48' fill='#7dd3fc'/>
      </g>
    </svg>`
  );

export default function LoginModal({
  open,
  onClose,
  onLogin,
  onRegister,
  title = 'Xin chào,',
  sideImageUrl,
  apiBase = 'http://localhost:3000',
}: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { me, login } = useAuth();
  const greeting = me?.full_name ? `Xin chào, ${me.full_name}` : me?.email ? `Xin chào, ${me.email}` : title;

  // login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);

  // register
  const [reg, setReg] = useState<RegisterPayload>({
    username: '',
    full_name: '',
    dob: '',
    phone: '',
    gender: '',
    email: '',
    password: '',
    country: 'Vietnam',
  });
  const [showRegPw, setShowRegPw] = useState(false);

  const [countries, setCountries] = useState<{ name: string; code: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // lỗi theo tab
  const [errorLogin, setErrorLogin] = useState<string | null>(null);
  const [errorRegister, setErrorRegister] = useState<string | null>(null);

  // modal "Quên mật khẩu"
  const [showForgot, setShowForgot] = useState(false);

  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);

  function focusFirstError(fieldName?: string) {
    if (!fieldName) return;
    const el =
      document.querySelector<HTMLInputElement>(`input[name="${fieldName}"]`) ||
      document.querySelector<HTMLInputElement>(`select[name="${fieldName}"]`);
    el?.focus();
  }

  useEffect(() => {
    if (!open) return;
    fetch('https://restcountries.com/v3.1/all?fields=name,cca2')
      .then((res) => res.json())
      .then((data) => setCountries(data.map((c: any) => ({ name: c.name.common, code: c.cca2 }))));
  }, [open]);

  useEffect(() => {
    if (open) setTimeout(() => emailRef.current?.focus(), 80);
  }, [open, mode]);

  useEffect(() => {
    if (mode === 'login') setErrorRegister(null);
    else setErrorLogin(null);
  }, [mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // API login
  const callDefaultLogin = async (payload: LoginPayload) => {
    const res = await fetch(`${apiBase}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Đăng nhập thất bại');
    if (data?.access_token) {
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.data));
      const cartRes = await fetch(`${apiBase}/cart/me`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      localStorage.setItem('cart', JSON.stringify(await cartRes.json()));
    }
    return data;
  };

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const result = validateLoginPayload({ email, password });
    if (!result.ok) {
      setErrorLogin(result.errors[0].message);
      focusFirstError(result.errors[0].field as string);
      return;
    }
    setErrorLogin(null);
    setSubmitting(true);
    try {
      if (onLogin) await onLogin({ email, password });
      else await callDefaultLogin({ email, password });
      onClose();
    } catch (err: any) {
      setErrorLogin(err?.message ?? 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const result = validateRegisterPayload(reg as any);
    if (!result.ok) {
      setErrorRegister(result.errors[0].message);
      focusFirstError(result.errors[0].field as string);
      return;
    }
    setErrorRegister(null);
    setSubmitting(true);
    try {
      await requestRegisterOtp(reg.email);
      sessionStorage.setItem('pendingRegister', JSON.stringify(reg));
      onClose();
      navigate(`/verify-otp?email=${encodeURIComponent(reg.email)}`);
    } catch (err: any) {
      setErrorRegister(err?.message ?? 'Gửi OTP thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const width = 500;
      const height = 600;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        `${apiBase}/auth/google`,
        'GoogleLogin',
        `width=${width},height=${height},top=${top},left=${left}`
      );
      if (!popup) throw new Error('Không thể mở popup');

      const listener = (event: MessageEvent) => {
        if (event.origin !== new URL(apiBase).origin) return;
        const data = event.data;
        if (data?.access_token) {
          login(data.user, data.access_token);
          fetch(`${apiBase}/cart/me`, {
            headers: { Authorization: `Bearer ${data.access_token}` },
          })
            .then((res) => res.json())
            .then((cartJson) => localStorage.setItem('cart', JSON.stringify(cartJson)));
          onClose();
          popup.close();
          window.removeEventListener('message', listener);
          window.location.href = '/home';
        }
      };
      window.addEventListener('message', listener);
    } catch (err: any) {
      setErrorLogin(err.message || 'Đăng nhập Google thất bại');
    }
  };

  const RightArt = sideImageUrl || defaultSide;

  return (
    <div aria-modal role="dialog" className="fixed inset-0 z-[100] overflow-y-auto">
      {/* overlay */}
      <div className="fixed inset-0 bg-black/55 backdrop-blur-[1px]" onClick={onClose} />

      {/* modal */}
      <div
        className="relative z-[101] mx-auto my-6 w-[min(1000px,96vw)]
                   rounded-[24px] overflow-hidden bg-white/95 shadow-2xl ring-1 ring-black/5"
      >
        {/* close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Đóng"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* LEFT: form */}
          <div className="p-6 sm:p-8">
            <div className="mb-3">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">{greeting}</h3>
              <p className="mt-1 text-sm text-slate-600">Đăng nhập hoặc tạo tài khoản để mua sắm nhanh hơn</p>
            </div>

            {/* tabs */}
            <div className="mt-2 flex w-full rounded-full bg-slate-100 p-0.5">
              <button
                className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
                  mode === 'login' ? 'bg-white shadow text-sky-700' : 'text-slate-600 hover:text-slate-800'
                }`}
                onClick={() => setMode('login')}
              >
                Đăng nhập
              </button>
              <button
                className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
                  mode === 'register' ? 'bg-white shadow text-sky-700' : 'text-slate-600 hover:text-slate-800'
                }`}
                onClick={() => setMode('register')}
              >
                Đăng ký
              </button>
            </div>

            {/* error theo tab */}
            {mode === 'login' && errorLogin && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 py-2.5 px-4 text-sm text-rose-700">
                {errorLogin}
              </div>
            )}
            {mode === 'register' && errorRegister && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 py-2.5 px-4 text-sm text-rose-700">
                {errorRegister}
              </div>
            )}

            {/* content */}
            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                <Field
                  ref={emailRef}
                  name="email"
                  label="Email"
                  placeholder="nhapemail@domain.com"
                  value={email}
                  onChange={setEmail}
                  iconLeft={<Mail className="h-4 w-4" />}
                  type="email"
                  autoComplete="email"
                />
                <Field
                  name="password"
                  label="Mật khẩu"
                  placeholder="mật khẩu"
                  value={password}
                  onChange={setPassword}
                  iconLeft={<Lock className="h-4 w-4" />}
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  rightSlot={
                    <button
                      type="button"
                      className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                      onClick={() => setShowPw((v) => !v)}
                      aria-label={showPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                />

                <div className="mt-1 flex items-center justify-between">
                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    Ghi nhớ đăng nhập
                  </label>

                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowForgot(true);
                    }}
                    className="text-xs font-medium text-sky-600 hover:underline"
                  >
                    Quên mật khẩu?
                  </a>
                </div>

                <FancyButton loading={submitting} type="submit" className="mt-2 rounded-full">
                  Tiếp tục
                </FancyButton>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <FcGoogle className="h-5 w-5" />
                    Đăng nhập với Google
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="mt-6 grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    name="username"
                    label="Username"
                    placeholder="Tên đăng nhập"
                    value={reg.username}
                    onChange={(v) => setReg({ ...reg, username: v })}
                    iconLeft={<User className="h-4 w-4" />}
                  />
                  <Field
                    name="full_name"
                    label="Họ và tên"
                    placeholder="Nguyễn Văn A"
                    value={reg.full_name}
                    onChange={(v) => setReg({ ...reg, full_name: v })}
                    iconLeft={<BadgeCheck className="h-4 w-4" />}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    name="dob"
                    label="Ngày sinh"
                    value={reg.dob}
                    onChange={(v) => setReg({ ...reg, dob: v })}
                    iconLeft={<Calendar className="h-4 w-4" />}
                    type="date"
                  />
                  <Field
                    name="phone"
                    label="Số điện thoại"
                    placeholder="09xx xxx xxx"
                    value={reg.phone}
                    onChange={(v) => setReg({ ...reg, phone: v })}
                    iconLeft={<Phone className="h-4 w-4" />}
                  />
                </div>

                {/* giới tính */}
                <div>
                  <div className="mb-1 text-sm font-medium text-slate-700">Giới tính</div>
                  <input type="hidden" name="gender" value={reg.gender} />
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'male', label: 'Nam' },
                      { key: 'female', label: 'Nữ' },
                      { key: 'other', label: 'Khác' },
                    ].map((g) => {
                      const active = reg.gender === g.key;
                      return (
                        <button
                          key={g.key}
                          type="button"
                          onClick={() => setReg({ ...reg, gender: g.key })}
                          aria-pressed={active}
                          className={`h-8 rounded-full border px-3 text-sm transition ${
                            active
                              ? 'border-sky-500 bg-sky-50 text-sky-700 ring-2 ring-sky-100'
                              : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    name="email"
                    label="Email"
                    placeholder="nhapemail@domain.com"
                    value={reg.email}
                    onChange={(v) => setReg({ ...reg, email: v })}
                    iconLeft={<Mail className="h-4 w-4" />}
                    type="email"
                    autoComplete="email"
                  />
                  <Field
                    name="password"
                    label="Mật khẩu"
                    placeholder="mật khẩu"
                    value={reg.password}
                    onChange={(v) => setReg({ ...reg, password: v })}
                    iconLeft={<Lock className="h-4 w-4" />}
                    type={showRegPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    rightSlot={
                      <button
                        type="button"
                        className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                        onClick={() => setShowRegPw((v) => !v)}
                        aria-label={showRegPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      >
                        {showRegPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                  />
                </div>

                {/* country */}
                <div className="group">
                  <label className="mb-1 block text-sm font-medium text-slate-700">Đất nước</label>
                  <div className="relative flex items-center rounded-2xl border border-slate-300 bg-white focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
                    <span className="pointer-events-none absolute left-3 text-slate-400">
                      <Globe className="h-4 w-4" />
                    </span>
                    <select
                      name="country"
                      value={reg.country}
                      onChange={(e) => setReg({ ...reg, country: e.target.value })}
                      className="w-full rounded-2xl bg-transparent h-10 pl-10 pr-3 text-sm text-slate-900 outline-none"
                    >
                      <option value="Vietnam">Vietnam</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <FancyButton loading={submitting} type="submit" className="mt-1 rounded-full">
                  Tạo tài khoản
                </FancyButton>
              </form>
            )}

            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              Bằng việc tiếp tục, bạn đã đọc và đồng ý với{' '}
              <a href="#" className="font-medium text-sky-600 hover:underline">
                điều khoản sử dụng
              </a>{' '}
              và{' '}
              <a href="#" className="font-medium text-sky-600 hover:underline">
                chính sách bảo mật
              </a>
              .
            </p>
          </div>

          {/* RIGHT */}
          <div className="hidden lg:flex min-h-full bg-gradient-to-br from-sky-50 to-indigo-50 p-6 flex-col items-center justify-center border-l border-slate-200/70">
            <img src={RightArt} alt="Welcome" className="max-h-[160px] w-full object-contain" />
            <div className="mt-5 text-center">
              <div className="text-base font-semibold text-slate-900">Mua sắm tại EveryMart</div>
              <div className="mt-1 text-sm text-slate-600">Nhiều ưu đãi mỗi ngày</div>
            </div>
          </div>
        </div>

        <ForgotPasswordModal open={showForgot} onClose={() => setShowForgot(false)} apiBase={apiBase} />
      </div>
    </div>
  );
}

/* ========= Subcomponents ========= */
type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  iconLeft?: React.ReactNode;
  rightSlot?: React.ReactNode;
  autoComplete?: string;
  name?: string;
};

const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, value, onChange, placeholder, type = 'text', iconLeft, rightSlot, autoComplete, name },
  ref
) {
  return (
    <div className="group">
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative flex items-center rounded-2xl border border-slate-300 bg-white focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100">
        {iconLeft && <span className="pointer-events-none absolute left-3 text-slate-400">{iconLeft}</span>}
        <input
          ref={ref}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          autoComplete={autoComplete}
          className={`w-full rounded-2xl bg-transparent py-2.5 text-sm text-slate-900 outline-none ${
            iconLeft ? 'pl-10' : 'pl-3'
          } ${rightSlot ? 'pr-10' : 'pr-3'}`}
        />
        {rightSlot && <span className="absolute right-2">{rightSlot}</span>}
      </div>
    </div>
  );
});

function FancyButton({
  children,
  loading,
  className = '',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      {...rest}
      disabled={loading || rest.disabled}
      className={`w-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 py-2.5 text-sm font-semibold text-white
                  shadow-sm transition hover:from-sky-600 hover:to-cyan-600 focus:outline-none
                  focus:ring-2 focus:ring-sky-200 disabled:opacity-60 ${className}`}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" className="fill-none stroke-white/30" strokeWidth="4" />
            <path d="M22 12a10 10 0 0 1-10 10" className="fill-none stroke-white" strokeWidth="4" />
          </svg>
          Đang xử lý...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

