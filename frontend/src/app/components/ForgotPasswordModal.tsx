import React, { useEffect, useState, useRef } from "react";
import { verifyPasswordOtp, requestPasswordOtp } from "../../service/auth.service";
import { Eye, EyeOff, RotateCcw } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  apiBase?: string;
};

export default function ForgotPasswordModal({
  open,
  onClose,
  apiBase = "http://localhost:3000",
}: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    const code = otp.join("");
    if (step === 2 && code.length === 6 && !loading) {
      verifyOtp(code);
    }
  }, [otp]);

  /* ---------- Reset modal khi mở ---------- */
  useEffect(() => {
    if (open) {
      setStep(1);
      setEmail("");
      setOtp(Array(6).fill(""));
      setPw("");
      setPw2("");
      setMsg(null);
      setErr(null);
      setCooldown(0);
    }
  }, [open]);

  /* ---------- Countdown resend ---------- */
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!open) return null;

  /* ---------- 1️⃣ Gửi OTP ---------- */
  const onSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setMsg(null);
    setErr(null);
    const mail = email.trim();
    if (!mail) return setErr("Vui lòng nhập email hợp lệ.");

    try {
      setLoading(true);
      setMsg("Đang gửi OTP...");
      const res = await requestPasswordOtp(apiBase, mail);
      setMsg(res.message || "Nếu email tồn tại, mã OTP đã được gửi đến hộp thư của bạn.");
      setStep(2);
      setCooldown(30);
      setTimeout(() => inputs.current[0]?.focus(), 200);
    } catch (e: any) {
      setErr(e?.message || "Gửi OTP thất bại.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- 2️⃣ Xác thực OTP ---------- */
  const verifyOtp = async (codeParam?: string) => {
    const code = codeParam || otp.join("");
    if (code.length < 6) return setErr("Vui lòng nhập đủ 6 số OTP.");
    setErr(null);
    setMsg("Đang xác thực OTP...");
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/users/password/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMsg("✅ OTP hợp lệ. Mời bạn đặt lại mật khẩu.");
        setStep(3);
      } else {
        throw new Error(data.message || "OTP không đúng.");
      }
    } catch (e: any) {
      setErr(e?.message || "Mã OTP không đúng hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------- 🔁 Tự động xác thực khi đủ 6 số ---------- */
  

  /* ---------- 3️⃣ Đổi mật khẩu ---------- */
  const onChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pw || pw.length < 6) return setErr("Mật khẩu tối thiểu 6 ký tự.");
    if (pw !== pw2) return setErr("Mật khẩu nhập lại không khớp.");

    try {
      setLoading(true);
      const res = await verifyPasswordOtp(apiBase, {
        email: email.trim(),
        code: otp.join(""),
        newPassword: pw,
      });

      if (res.success) {
        setMsg(res.message || "Đổi mật khẩu thành công!");
        setTimeout(onClose, 1500);
      } else {
        throw new Error(res.message || "Đổi mật khẩu thất bại.");
      }
    } catch (e: any) {
      setErr(e?.message || "Đổi mật khẩu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  

  const resendOtp = () => {
    if (cooldown > 0 || loading) return;
    onSendOtp();
  };

  /* ---------- JSX ---------- */
  return (
    <div aria-modal role="dialog" className="fixed inset-0 z-[120] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-[121] mx-auto w-[min(420px,92vw)] rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">
            {step === 1
              ? "Quên mật khẩu"
              : step === 2
              ? "Nhập mã OTP"
              : "Đặt lại mật khẩu mới"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-600 hover:bg-slate-100 rounded-full"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {msg && (
          <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {msg}
          </div>
        )}
        {err && (
          <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {err}
          </div>
        )}

        {/* ---------- Step 1: Email ---------- */}
        {step === 1 && (
          <form onSubmit={onSendOtp} className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nhapemail@domain.com"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 py-2.5 text-sm font-semibold text-white hover:from-sky-600 hover:to-cyan-600 disabled:opacity-60"
            >
              {loading ? "Đang gửi..." : "Gửi OTP"}
            </button>
          </form>
        )}

        {/* ---------- Step 2: OTP ---------- */}
        {step === 2 && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-slate-600">
              Nhập mã OTP 6 số được gửi tới <strong>{email}</strong>
            </p>

            <div
              className="flex justify-between gap-2"
              onPaste={(e) => {
                e.preventDefault();
                const paste = e.clipboardData.getData("text").replace(/\D/g, "");
                if (!paste) return;
                const chars = paste.split("").slice(0, 6);
                setOtp(chars.concat(Array(6 - chars.length).fill("")));
              }}
            >
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {inputs.current[i] = el}}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  autoComplete="off"
                  className="w-10 h-10 text-center text-lg border border-slate-300 rounded-md focus:border-sky-500 focus:ring-1 focus:ring-sky-200 outline-none transition"
                  value={digit}
                  onInput={(e) => {
                    const val = (e.target as HTMLInputElement).value.replace(/\D/g, "").slice(-1);
                    if (!val) return;
                    const newOtp = [...otp];
                    newOtp[i] = val;
                    setOtp(newOtp);
                    if (i < 5) requestAnimationFrame(() => inputs.current[i + 1]?.focus());
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace") {
                      e.preventDefault();
                      const newOtp = [...otp];
                      if (otp[i]) newOtp[i] = "";
                      else if (i > 0) newOtp[i - 1] = "";
                      setOtp(newOtp);
                      if (!otp[i] && i > 0) requestAnimationFrame(() => inputs.current[i - 1]?.focus());
                    }
                    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
                    if (e.key === "ArrowRight" && i < 5) inputs.current[i + 1]?.focus();
                  }}
                  onFocus={(e) => e.target.select()}
                />
              ))}
            </div>

            <div className="flex items-center justify-between mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-sky-600 hover:underline"
              >
                ← Nhập lại email
              </button>

              <button
                type="button"
                onClick={resendOtp}
                disabled={cooldown > 0 || loading}
                className="flex items-center gap-1 text-xs text-sky-600 hover:underline disabled:text-slate-400"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {cooldown > 0 ? `Gửi lại (${cooldown}s)` : "Gửi lại OTP"}
              </button>
            </div>
          </div>
        )}

        {/* ---------- Step 3: Đổi mật khẩu ---------- */}
        {step === 3 && (
          <form onSubmit={onChangePassword} className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-2.5 text-slate-500"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nhập lại mật khẩu</label>
              <div className="relative">
                <input
                  type={showPw2 ? "text" : "password"}
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPw2((v) => !v)}
                  className="absolute right-3 top-2.5 text-slate-500"
                >
                  {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 py-2.5 text-sm font-semibold text-white hover:from-sky-600 hover:to-cyan-600 disabled:opacity-60"
            >
              {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
