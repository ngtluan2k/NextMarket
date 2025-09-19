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
} from 'lucide-react';

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  username: string;
  full_name: string;
  dob: string;
  phone: string;
  gender: string; // "male" | "female" | "other"
  email: string;
  password: string;
};

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
  onLogin?: (data: LoginPayload) => Promise<void> | void;
  onRegister?: (data: RegisterPayload) => Promise<void> | void;
  title?: string;
  sideImageUrl?: string;
  apiBase?: string; // default: http://localhost:3000
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

  // login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);

  // register states
  const [reg, setReg] = useState<RegisterPayload>({
    username: '',
    full_name: '',
    dob: '',
    phone: '',
    gender: '',
    email: '',
    password: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => emailRef.current?.focus(), 80);
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

    // ---------- validate ----------
    const validateLogin = () => {
      if (!/^\S+@\S+\.\S+$/.test(email)) return "Email không hợp lệ";
      if (password.length < 6) return "Mật khẩu tối thiểu 6 ký tự";
      return null;
    };
    const validateRegister = () => {
      if (!reg.username) return "Vui lòng nhập Username";
      if (!reg.full_name) return "Vui lòng nhập Họ tên";
      if (!reg.dob) return "Vui lòng chọn ngày sinh";
      if (!reg.phone) return "Vui lòng nhập SĐT";
      if (!reg.gender) return "Vui lòng chọn giới tính";
      if (!/^\S+@\S+\.\S+$/.test(reg.email)) return "Email không hợp lệ";
      if ((reg.password || "").length < 6) return "Mật khẩu tối thiểu 6 ký tự";
      return null;
    };

    // ---------- default APIs ----------
const callDefaultLogin = async (payload: LoginPayload) => {
  const res = await fetch(`${apiBase}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Đăng nhập thất bại");

  if (data?.access_token) {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.data));

    // fetch giỏ hàng riêng theo user
    const cartRes = await fetch(`${apiBase}/cart/me`, {
      headers: { Authorization: `Bearer ${data.access_token}` },
    });
    const cartJson = await cartRes.json();
    localStorage.setItem("cart", JSON.stringify(cartJson));
  }

  return data;
};


  const callDefaultRegister = async (payload: RegisterPayload) => {
    const res = await fetch(`${apiBase}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Đăng ký thất bại');
    return data;
  };
  // ---------- submit ----------
  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = validateLogin();
    if (v) return setError(v);
    setError(null);
    setSubmitting(true);
    try {
      if (onLogin) await onLogin({ email, password });
      else await callDefaultLogin({ email, password });

      // close modal
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = validateRegister();
    if (v) return setError(v);
    setError(null);
    setSubmitting(true);
    try {
      if (onRegister) await onRegister(reg);
      else await callDefaultRegister(reg);

      // after successful register, switch to login and prefill email
      setMode('login');
      setEmail(reg.email);
      setPassword('');
    } catch (err: any) {
      setError(err?.message ?? 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };
  const RightArt = sideImageUrl || defaultSide;

  return (
    <div
      aria-modal
      role="dialog"
      className="fixed inset-0 z-[100] grid place-items-center"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative z-[101] w-[min(920px,95vw)] rounded-3xl bg-white/95 shadow-2xl ring-1 ring-black/5
                    grid grid-cols-1 lg:grid-cols-[1fr_1fr] overflow-hidden"
      >
        {/* Close */}
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

        {/* Left: form */}
        <div className="p-7 sm:p-9">
          <div className="mb-3">
            <h3 className="text-2xl font-bold tracking-tight text-slate-900">
              {title}
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Đăng nhập hoặc tạo tài khoản để mua sắm nhanh hơn
            </p>
          </div>

          {/* Tabs */}
          <div className="mt-2 flex w-full rounded-xl bg-slate-100 p-1">
            <button
              className={`flex-1 rounded-lg  py-2 text-sm font-medium transition
                ${
                  mode === 'login'
                    ? 'bg-white shadow text-sky-700'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              onClick={() => setMode('login')}
            >
              Đăng nhập
            </button>
            <button
              className={`flex-1 rounded-lg  py-2 text-sm font-medium transition
                ${
                  mode === 'register'
                    ? 'bg-white shadow text-sky-700'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              onClick={() => setMode('register')}
            >
              Đăng ký
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50  py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Content */}
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="mt-5 space-y-4">
              <Field
                ref={emailRef}
                label="Email"
                placeholder="nhapemail@domain.com"
                value={email}
                onChange={setEmail}
                iconLeft={<Mail className="h-4 w-4" />}
                type="email"
                autoComplete="email"
              />
              <Field
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
                    className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                    onClick={() => setShowPw((v) => !v)}
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
                  className="text-xs font-medium text-sky-600 hover:underline"
                >
                  Quên mật khẩu?
                </a>
              </div>

              <FancyButton loading={submitting} type="submit" className="mt-2">
                Tiếp tục
              </FancyButton>
            </form>
          ) : (
            <form
              onSubmit={handleRegister}
              className="mt-5 grid grid-cols-1 gap-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 required">
                <Field
                  label="Username"
                  placeholder="Tên đăng nhập"
                  value={reg.username}
                  onChange={(v) => setReg({ ...reg, username: v })}
                  iconLeft={<User className="h-4 w-4" />}
                />
                <Field
                  label="Họ và tên"
                  placeholder="Nguyễn Văn A"
                  value={reg.full_name}
                  onChange={(v) => setReg({ ...reg, full_name: v })}
                  iconLeft={<BadgeCheck className="h-4 w-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Ngày sinh"
                  value={reg.dob}
                  onChange={(v) => setReg({ ...reg, dob: v })}
                  iconLeft={<Calendar className="h-4 w-4" />}
                  type="date"
                />
                <Field
                  label="Số điện thoại"
                  placeholder="09xx xxx xxx"
                  value={reg.phone}
                  onChange={(v) => setReg({ ...reg, phone: v })}
                  iconLeft={<Phone className="h-4 w-4" />}
                />
              </div>

              {/* Gender chips */}
              <div>
                <div className="mb-1 text-sm font-medium text-slate-700">
                  Giới tính
                </div>
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
                        className={`h-9 rounded-full border px-4 text-sm transition
                              ${
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field
                  label="Email"
                  placeholder="nhapemail@domain.com"
                  value={reg.email}
                  onChange={(v) => setReg({ ...reg, email: v })}
                  iconLeft={<Mail className="h-4 w-4" />}
                  type="email"
                  autoComplete="email"
                />
                <Field
                  label="Mật khẩu"
                  placeholder="mật khẩu"
                  value={reg.password}
                  onChange={(v) => setReg({ ...reg, password: v })}
                  iconLeft={<Lock className="h-4 w-4" />}
                  type="password"
                  autoComplete="new-password"
                />
              </div>

              <FancyButton loading={submitting} type="submit" className="mt-1">
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

        {/* Right: artwork */}
        <div className="hidden min-h-[480px] bg-gradient-to-br from-sky-50 to-indigo-50 p-8 lg:flex lg:flex-col lg:items-center lg:justify-center">
          <img
            src={RightArt}
            alt="Welcome"
            className="max-h-[300px] w-full object-contain"
          />
          <div className="mt-6 text-center">
            <div className="text-base font-semibold text-slate-900">
              Mua sắm tại EveryMart
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Nhiều ưu đãi mỗi ngày
            </div>
          </div>
        </div>
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
};

const Field = React.forwardRef<HTMLInputElement, FieldProps>(function Field(
  {
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    iconLeft,
    rightSlot,
    autoComplete,
  },
  ref
) {
  return (
    <div className="group">
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div
        className="relative flex items-center rounded-xl border border-slate-300 bg-white
                    focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100"
      >
        {iconLeft && (
          <span className="pointer-events-none absolute left-3 text-slate-400">
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type={type}
          autoComplete={autoComplete}
          className={`w-full rounded-xl bg-transparent  py-2.5 text-sm text-slate-900 outline-none
                        ${iconLeft ? 'pl-10' : 'pl-3'} ${
            rightSlot ? 'pr-10' : 'pr-3'
          }`}
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
      className={`w-full rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 py-2.5 text-sm font-semibold text-white
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
