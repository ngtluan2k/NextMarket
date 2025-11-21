// src/components/LoginModal.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Mail,
  Lock,
  User,
  Calendar,
  Phone,
  BadgeCheck,
  Eye,
  EyeOff,
  Globe,
  ChevronDown,
  Check,
} from 'lucide-react';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { requestRegisterOtp } from '../../service/auth.service';
import {
  validateLogin as validateLoginPayload,
  validateRegister as validateRegisterPayload,
} from '../../validation/auth.validation';
import ForgotPasswordModal from './ForgotPasswordModal';
import { createPortal } from 'react-dom';

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
  onLogin?: (
    data: LoginPayload
  ) => Promise<{ ok: boolean; message?: string } | boolean | void>;
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
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

export default function LoginModal({
  open,
  onClose,
  onLogin,
  onRegister, // chưa dùng
  title = 'Xin chào,',
  sideImageUrl,
  apiBase = `${BE_BASE_URL}`,
}: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const { me, login } = useAuth();
  const greeting = me?.full_name
    ? `Xin chào, ${me.full_name}`
    : me?.email
    ? `Xin chào, ${me.email}`
    : title;

  // ===== Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);

  // ===== Register state
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

  // confirm password
  const [regConfirmPw, setRegConfirmPw] = useState('');
  const [showRegConfirmPw, setShowRegConfirmPw] = useState(false);

  // per-field errors & touched for REGISTER
  const [regErrors, setRegErrors] = useState<
    Partial<Record<keyof RegisterPayload | 'confirm_password', string>>
  >({});
  const [regTouched, setRegTouched] = useState<
    Partial<Record<keyof RegisterPayload | 'confirm_password', boolean>>
  >({});

  const [countries, setCountries] = useState<{ name: string; code: string }[]>(
    []
  );
  const [submitting, setSubmitting] = useState(false);

  // banner theo tab
  const [errorLogin, setErrorLogin] = useState<string | null>(null);
  const [errorRegister, setErrorRegister] = useState<string | null>(null);

  const [showForgot, setShowForgot] = useState(false);

  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);

  function focusFirstError(fieldName?: string) {
    if (!fieldName) return;
    const el =
      document.querySelector<HTMLInputElement>(`input[name="${fieldName}"]`) ||
      document.querySelector<HTMLInputElement>(`select[name="${fieldName}"]`) ||
      document.querySelector<HTMLElement>(`[data-focus="${fieldName}"]`);
    el?.focus();
  }

  useEffect(() => {
    if (!open) return;
    fetch('https://restcountries.com/v3.1/all?fields=name,cca2')
      .then((res) => res.json())
      .then((data) =>
        setCountries(
          data.map((c: any) => ({ name: c.name.common, code: c.cca2 }))
        )
      );
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

  // ===== Helpers: register validation mapping
  function buildRegisterErrors(next: RegisterPayload, confirmPw: string) {
    const v = validateRegisterPayload(next);
    const map: Partial<
      Record<keyof RegisterPayload | 'confirm_password', string>
    > = {};
    v.errors.forEach((e) => (map[e.field] = e.message));
    if (confirmPw && next.password !== confirmPw) {
      map.confirm_password = 'Mật khẩu và Nhập lại mật khẩu không khớp';
    }
    return map;
  }

  function updateField<K extends keyof RegisterPayload>(
    field: K,
    value: RegisterPayload[K]
  ) {
    const next = { ...reg, [field]: value };
    setReg(next);
    const errs = buildRegisterErrors(next, regConfirmPw);
    const filtered: typeof regErrors = {};
    (Object.keys(errs) as Array<keyof typeof errs>).forEach((k) => {
      if (regTouched[k]) filtered[k] = errs[k];
    });
    setRegErrors((prev) => ({ ...prev, ...filtered }));
  }

  function touchField(name: keyof RegisterPayload | 'confirm_password') {
    setRegTouched((t) => ({ ...t, [name]: true }));
    const errs = buildRegisterErrors(reg, regConfirmPw);
    setRegErrors((e) => ({ ...e, [name]: errs[name] }));
  }

  // ===== API login
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
      const tokenBefore = localStorage.getItem('token');

      if (onLogin) {
        const r = await onLogin({ email, password });
        let ok: boolean | undefined;
        let msg: string | undefined;

        if (typeof r === 'boolean') ok = r;
        else if (r && typeof r === 'object') {
          ok = !!(r as any).ok;
          msg = (r as any).message;
        }

        const tokenAfter = localStorage.getItem('token');
        if (ok !== true && tokenAfter === tokenBefore) {
          throw new Error(msg || 'Sai email hoặc mật khẩu');
        }
        onClose();
      } else {
        await callDefaultLogin({ email, password });
        onClose();
      }
    } catch (err: any) {
      setErrorLogin(err?.message ?? 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();

    // Touch all để hiện toàn bộ lỗi khi submit lần đầu
    const allTouched: Partial<
      Record<keyof RegisterPayload | 'confirm_password', boolean>
    > = {
      username: true,
      full_name: true,
      dob: true,
      phone: true,
      gender: true,
      email: true,
      password: true,
      country: true,
      confirm_password: true,
    };
    setRegTouched(allTouched);

    const errs = buildRegisterErrors(reg, regConfirmPw);
    setRegErrors(errs);

    if (Object.keys(errs).length > 0) {
      const first = Object.keys(errs)[0];
      focusFirstError(first);
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
          localStorage.setItem('token', data.access_token);
          localStorage.setItem('user', JSON.stringify(data.user));
          fetch(`${apiBase}/cart/me`, {
            headers: { Authorization: `Bearer ${data.access_token}` },
          })
            .then((res) => res.json())
            .then((cartJson) =>
              localStorage.setItem('cart', JSON.stringify(cartJson))
            );
          onClose();
          popup.close();
          window.removeEventListener('message', listener);
          navigate('/home');
        }
      };
      window.addEventListener('message', listener);
    } catch (err: any) {
      setErrorLogin(err.message || 'Đăng nhập Google thất bại');
    }
  };

  const RightArt = sideImageUrl || defaultSide;

  return (
    <div
      aria-modal
      role="dialog"
      className="fixed inset-0 z-[100] overflow-y-auto"
    >
      {/* overlay */}
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-[1px]"
        onClick={onClose}
      />

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
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* LEFT: form */}
          <div className="p-6 sm:p-8">
            <div className="mb-3">
              <h3 className="text-2xl font-bold tracking-tight text-slate-900">
                {greeting}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                Đăng nhập hoặc tạo tài khoản để mua sắm nhanh hơn
              </p>
            </div>

            {/* tabs */}
            <div className="mt-2 flex w-full rounded-full bg-slate-100 p-0.5">
              <button
                className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
                  mode === 'login'
                    ? 'bg-white shadow text-sky-700'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
                onClick={() => setMode('login')}
              >
                Đăng nhập
              </button>
              <button
                className={`flex-1 rounded-full py-2 text-sm font-medium transition ${
                  mode === 'register'
                    ? 'bg-white shadow text-sky-700'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
                onClick={() => setMode('register')}
              >
                Đăng ký
              </button>
            </div>

            {/* banner theo tab (tùy chọn) */}
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
                      {showPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
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

                <FancyButton
                  loading={submitting}
                  type="submit"
                  className="mt-2 rounded-full"
                >
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
              // REGISTER FORM
              <form
                onSubmit={handleRegister}
                className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {/* Username | Họ tên */}
                <Field
                  name="username"
                  label="Username"
                  placeholder="Tên đăng nhập"
                  value={reg.username}
                  onChange={(v) => updateField('username', v)}
                  onBlur={() => touchField('username')}
                  error={regErrors.username}
                  iconLeft={<User className="h-4 w-4" />}
                />
                <Field
                  name="full_name"
                  label="Họ và tên"
                  placeholder="Nguyễn Văn A"
                  value={reg.full_name}
                  onChange={(v) => updateField('full_name', v)}
                  onBlur={() => touchField('full_name')}
                  error={regErrors.full_name}
                  iconLeft={<BadgeCheck className="h-4 w-4" />}
                />

                {/* Ngày sinh | SĐT */}
                <Field
                  name="dob"
                  label="Ngày sinh"
                  value={reg.dob}
                  onChange={(v) => updateField('dob', v)}
                  onBlur={() => touchField('dob')}
                  error={regErrors.dob}
                  iconLeft={<Calendar className="h-4 w-4" />}
                  type="date"
                />
                <Field
                  name="phone"
                  label="Số điện thoại"
                  placeholder="09xx xxx xxx"
                  value={reg.phone}
                  onChange={(v) => updateField('phone', v)}
                  onBlur={() => touchField('phone')}
                  error={regErrors.phone}
                  iconLeft={<Phone className="h-4 w-4" />}
                />

                {/* Mật khẩu | Nhập lại mật khẩu */}
                <Field
                  name="password"
                  label="Mật khẩu"
                  placeholder="mật khẩu"
                  value={reg.password}
                  onChange={(v) => updateField('password', v)}
                  onBlur={() => touchField('password')}
                  error={regErrors.password}
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
                      {showRegPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />
                <Field
                  name="confirm_password"
                  label="Nhập lại mật khẩu"
                  placeholder="nhập lại mật khẩu"
                  value={regConfirmPw}
                  onChange={(v) => {
                    setRegConfirmPw(v);
                    if (regTouched.confirm_password) {
                      const errs = buildRegisterErrors(reg, v);
                      setRegErrors((e) => ({
                        ...e,
                        confirm_password: errs.confirm_password,
                      }));
                    }
                  }}
                  onBlur={() => touchField('confirm_password')}
                  error={regErrors.confirm_password}
                  iconLeft={<Lock className="h-4 w-4" />}
                  type={showRegConfirmPw ? 'text' : 'password'}
                  autoComplete="new-password"
                  rightSlot={
                    <button
                      type="button"
                      className="rounded-full p-1 text-slate-500 hover:bg-slate-100"
                      onClick={() => setShowRegConfirmPw((v) => !v)}
                      aria-label={
                        showRegConfirmPw ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'
                      }
                    >
                      {showRegConfirmPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  }
                />

                {/* Email | Giới tính */}
                <Field
                  name="email"
                  label="Email"
                  placeholder="nhapemail@domain.com"
                  value={reg.email}
                  onChange={(v) => updateField('email', v)}
                  onBlur={() => touchField('email')}
                  error={regErrors.email}
                  iconLeft={<Mail className="h-4 w-4" />}
                  type="email"
                  autoComplete="email"
                />

                <SelectField
                  name="gender"
                  label="Giới tính"
                  value={reg.gender}
                  onChange={(v) => updateField('gender', v)}
                  onBlur={() => touchField('gender')}
                  error={regErrors.gender}
                  options={[
                    { label: 'Nam', value: 'male' },
                    { label: 'Nữ', value: 'female' },
                    { label: 'Khác', value: 'other' },
                  ]}
                  placeholder="Chọn giới tính"
                  iconLeft={<User className="h-4 w-4" />}
                />

                {/* Country */}
                <div className="md:col-span-2">
                  <SelectField
                    name="country"
                    label="Đất nước"
                    value={reg.country}
                    onChange={(v) => updateField('country', v)}
                    onBlur={() => touchField('country')}
                    error={regErrors.country}
                    options={[
                      { label: 'Vietnam', value: 'Vietnam' },
                      ...countries.map((c) => ({
                        label: c.name,
                        value: c.name,
                      })),
                    ]}
                    placeholder="Chọn quốc gia"
                    iconLeft={<Globe className="h-4 w-4" />}
                  />
                </div>

                {/* Submit */}
                <div className="md:col-span-2">
                  <FancyButton
                    loading={submitting}
                    type="submit"
                    className="mt-1 rounded-full"
                  >
                    Tạo tài khoản
                  </FancyButton>
                </div>
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
            <img
              src={RightArt}
              alt="Welcome"
              className="max-h-[160px] w-full object-contain"
            />
            <div className="mt-5 text-center">
              <div className="text-base font-semibold text-slate-900">
                Mua sắm tại EveryMart
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Nhiều ưu đãi mỗi ngày
              </div>
            </div>
          </div>
        </div>

        <ForgotPasswordModal
          open={showForgot}
          onClose={() => setShowForgot(false)}
          apiBase={apiBase}
        />
      </div>
    </div>
  );
}

/* ========= Subcomponents ========= */
type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void; // NEW
  placeholder?: string;
  type?: string;
  iconLeft?: React.ReactNode;
  rightSlot?: React.ReactNode;
  autoComplete?: string;
  name?: string;
  error?: string; // NEW
};

const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field(
  {
    label,
    value,
    onChange,
    onBlur,
    placeholder,
    type = 'text',
    iconLeft,
    rightSlot,
    autoComplete,
    name,
    error,
  },
  ref
) {
  const errorId = name ? `${name}-error` : undefined;
  return (
    <div className="group">
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div
        className={`relative flex items-center rounded-2xl border bg-white ${
          error
            ? 'border-rose-400 ring-2 ring-rose-100'
            : 'border-slate-300 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100'
        }`}
      >
        {iconLeft && (
          <span className="pointer-events-none absolute left-3 text-slate-400">
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          type={type}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={`w-full rounded-2xl bg-transparent py-2.5 text-sm text-slate-900 outline-none ${
            iconLeft ? 'pl-10' : 'pl-3'
          } ${rightSlot ? 'pr-10' : 'pr-3'}`}
        />
        {rightSlot && <span className="absolute right-2">{rightSlot}</span>}
      </div>
      {error && (
        <p id={errorId} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
});

/* ===== Select (custom dropdown) ===== */
type SelectOption = { label: string; value: string };

function cx(...s: (string | false | undefined)[]) {
  return s.filter(Boolean).join(' ');
}

function useOutside(handler: () => void) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [handler]);
  return ref;
}

function SelectField({
  name,
  label,
  value,
  onChange,
  onBlur,
  options,
  placeholder = 'Chọn…',
  iconLeft,
  error,
}: {
  name: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  placeholder?: string;
  iconLeft?: React.ReactNode;
  error?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [dir, setDir] = React.useState<'down' | 'up'>('down');
  const [coords, setCoords] = React.useState({
    left: 0,
    top: 0, // top cho menu khi mở xuống
    bottom: 0, // bottom cho menu khi mở lên (fixed)
    width: 0,
  });

  const btnRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = React.useRef<HTMLUListElement>(null);

  const current = options.find((o) => o.value === value);
  const errorId = `${name}-error`;
  const MENU_MAX_HEIGHT = 260;

  function measureAndPlace() {
    const btn = btnRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const openDir: 'down' | 'up' =
      spaceBelow < MENU_MAX_HEIGHT + 8 ? 'up' : 'down';
    setDir(openDir);
    setCoords({
      left: r.left,
      top: r.bottom,
      bottom: window.innerHeight - r.top,
      width: r.width,
    });
  }

  React.useEffect(() => {
    if (!open) return;
    measureAndPlace();

    const onScroll = () => measureAndPlace();
    const onResize = () => measureAndPlace();
    const onDocDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    document.addEventListener('mousedown', onDocDown);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousedown', onDocDown);
    };
  }, [open]);

  const triggerClass = cx(
    'flex w-full items-center justify-between bg-white text-left text-sm pl-3 pr-10 py-2.5 border transition',
    open
      ? error
        ? 'border-rose-400 ring-2 ring-rose-100'
        : 'border-sky-500 ring-2 ring-sky-100'
      : error
      ? 'border-rose-400 ring-2 ring-rose-100'
      : 'border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-500',
    open
      ? dir === 'down'
        ? 'rounded-t-2xl rounded-b-none'
        : 'rounded-b-2xl rounded-t-none'
      : 'rounded-2xl'
  );

  function commit(idx: number) {
    if (idx < 0 || idx >= options.length) return;
    onChange(options[idx].value);
    setOpen(false);
    btnRef.current?.focus();
  }

  function onKey(e: React.KeyboardEvent) {
    if (
      !open &&
      (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')
    ) {
      e.preventDefault();
      setOpen(true);
      // đo vị trí ngay khi mở
      requestAnimationFrame(measureAndPlace);
      return;
    }
    if (!open) return;
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
  }

  const menu = (
    <ul
      ref={menuRef}
      role="listbox"
      tabIndex={-1}
      style={{
        position: 'fixed',
        left: coords.left,
        width: coords.width,
        top: dir === 'down' ? coords.top : undefined,
        bottom: dir === 'up' ? coords.bottom : undefined,
        maxHeight: MENU_MAX_HEIGHT,
        overflowY: 'auto',
      }}
      className={cx(
        'z-[1100] bg-white shadow-xl',
        error ? 'border border-rose-400' : 'border border-slate-200',
        dir === 'down'
          ? 'rounded-b-2xl rounded-t-none border-t-0'
          : 'rounded-t-2xl rounded-b-none border-b-0'
      )}
    >
      {options.map((opt, idx) => {
        const selected = opt.value === value;
        return (
          <li
            key={opt.value}
            role="option"
            aria-selected={selected}
            onMouseDown={(e) => e.preventDefault()} // giữ không mất focus trước khi click
            onClick={() => commit(idx)}
            className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-sky-50 hover:text-sky-700"
          >
            <span className="truncate">{opt.label}</span>
            {selected && <Check className="h-4 w-4" />}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="group">
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input type="hidden" name={name} value={value} />
        <button
          ref={btnRef}
          data-focus={name}
          type="button"
          onClick={() => setOpen((v) => !v)}
          onKeyDown={onKey}
          onBlur={onBlur}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={triggerClass}
        >
          <span className="flex items-center gap-2">
            {iconLeft && <span className="text-slate-400">{iconLeft}</span>}
            <span className={cx('truncate', !current && 'text-slate-400')}>
              {current ? current.label : placeholder}
            </span>
          </span>
          <ChevronDown className="absolute right-3 h-4 w-4 text-slate-400" />
        </button>
      </div>

      {/* Menu render ra body để không bị cắt bởi overflow-hidden */}
      {open && createPortal(menu, document.body)}

      {error && (
        <p id={errorId} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

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
            <circle
              cx="12"
              cy="12"
              r="10"
              className="fill-none stroke-white/30"
              strokeWidth="4"
            />
            <path
              d="M22 12a10 10 0 0 1-10 10"
              className="fill-none stroke-white"
              strokeWidth="4"
            />
          </svg>
          Đang xử lý...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
