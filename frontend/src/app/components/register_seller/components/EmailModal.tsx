import React from 'react';
import { X, Mail } from 'lucide-react';

interface EmailFormData {
  email: string;
  description: string;
  is_default: boolean;
}

interface EmailModalProps {
  show: boolean;
  editingEmail: any;
  emailFormData: EmailFormData;
  onClose: () => void;
  onInputChange: (field: string, value: any) => void;
  onSave: () => void;
}

const baseInput =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-100';
const baseLabel = 'text-sm font-medium text-slate-700';

const EmailModal: React.FC<EmailModalProps> = ({
  show,
  editingEmail,
  emailFormData,
  onClose,
  onInputChange,
  onSave,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-lg">
        <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-100">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-800">
              {editingEmail ? 'Chỉnh sửa email nhận hóa đơn' : 'Thêm email nhận hóa đơn'}
            </h3>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 py-5">
            <form className="space-y-4">
              <div>
                <label className={baseLabel}>Địa chỉ email *</label>
                <input
                  type="email"
                  className={baseInput}
                  value={emailFormData.email}
                  onChange={(e) => onInputChange('email', e.target.value)}
                  placeholder="example@company.com"
                  required
                />
              </div>
            </form>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={onSave}
              className="inline-flex items-center justify-center rounded-xl bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-700 active:bg-sky-800"
            >
              <Mail className="mr-2 h-4 w-4" />
              {editingEmail ? 'Cập nhật email' : 'Thêm email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
