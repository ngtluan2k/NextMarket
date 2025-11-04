import React from 'react';
import { X, Mail } from 'lucide-react';

interface EmailFormData { email: string; description: string; is_default: boolean; }
interface EmailModalProps {
  show: boolean;
  editingEmail: any;
  emailFormData: EmailFormData;
  onClose: () => void;
  onInputChange: (field: string, value: any) => void;
  onSave: () => void;
}

const baseInput = 'w-full rounded-xl border bg-white px-3 py-1.5 outline-none transition focus:ring-4';
const baseLabel = 'text-[11px] font-medium text-slate-700';
const ok = 'border-slate-200 focus:border-sky-500 focus:ring-sky-100';
const err = 'border-rose-300 focus:border-rose-500 focus:ring-rose-100';
const withErr = (has: boolean) => `${baseInput} ${has ? err : ok}`;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EmailModal: React.FC<EmailModalProps> = ({ show, editingEmail, emailFormData, onClose, onInputChange, onSave }) => {
  const [errors, setErrors] = React.useState<{ email?: string }>({});

  const validateEmail = (v: string) => {
    const s = (v || '').trim().toLowerCase();
    if (!s) return 'Vui lòng nhập email';
    if (!emailRegex.test(s)) return 'Email không đúng định dạng';
    return '';
  };

  const handleBlur = () => {
    const n = (emailFormData.email || '').trim().toLowerCase();
    onInputChange('email', n);
    setErrors((p) => ({ ...p, email: validateEmail(n) }));
  };

  const handleChange =
    (field: keyof EmailFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (field === 'email' && errors.email) setErrors({});
      const value = field === 'is_default' ? (e.target as HTMLInputElement).checked : e.target.value;
      onInputChange(field, value);
    };

  React.useEffect(() => {
    if (show) setErrors({ email: validateEmail(emailFormData.email) });
    else setErrors({});
  }, [show]);

  const submit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const n = (emailFormData.email || '').trim().toLowerCase();
    const msg = validateEmail(n);
    if (msg) { setErrors({ email: msg }); return; }
    onInputChange('email', n);
    onSave();
  };

  if (!show) return null;

  const invalid = !!errors.email;
  const canSubmit = !invalid;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white shadow-xl ring-1 ring-slate-100">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800">
            {editingEmail ? 'Chỉnh sửa email nhận hóa đơn' : 'Thêm email nhận hóa đơn'}
          </h3>
          <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="px-6 py-5 space-y-3" onSubmit={submit}>
          <div>
            <label className={baseLabel}>Địa chỉ email *</label>
            <input
              type="email"
              className={withErr(invalid)}
              value={emailFormData.email}
              onChange={handleChange('email')}
              onBlur={handleBlur}
              placeholder="example@company.com"
              aria-invalid={invalid}
              required
            />
            {errors.email && <p className="mt-1 text-[11px] text-rose-600">{errors.email}</p>}
          </div>

          <div className="flex items-center gap-2">
            <input id="isDefaultEmail" type="checkbox" className="h-4 w-4 accent-sky-600" checked={!!emailFormData.is_default} onChange={handleChange('is_default')} />
            <label htmlFor="isDefaultEmail" className="text-[12px] text-slate-700">Đặt làm email mặc định</label>
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4">
          <button type="button" onClick={onClose} className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50">Hủy</button>
          <button type="button" onClick={() => submit()} disabled={!canSubmit} className={`inline-flex items-center justify-center rounded-xl px-4 py-2 font-medium text-white ${canSubmit ? 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800' : 'bg-slate-300 cursor-not-allowed'}`}>
            <Mail className="mr-2 h-4 w-4" /> {editingEmail ? 'Cập nhật email' : 'Thêm email'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
