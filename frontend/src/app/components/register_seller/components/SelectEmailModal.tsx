import React from 'react';
import { Mail, CheckCircle, X } from 'lucide-react';

interface SelectEmailModalProps {
  open: boolean;
  emails: Array<{ id: number; email: string; is_default: boolean; description?: string }>;
  onClose: () => void;
  onSelect: (id: number) => void;
}

const SelectEmailModal: React.FC<SelectEmailModalProps> = ({ open, emails, onClose, onSelect }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2">
          <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <Mail className="h-5 w-5 text-sky-600" /> Chọn email khác
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {emails.map((email) => (
            <div
              key={email.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                email.is_default ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'
              }`}
            >
              <div>
                <p className="font-medium text-slate-800">{email.email}</p>
                {email.description && (
                  <p className="text-xs text-slate-500">{email.description}</p>
                )}
              </div>
              {!email.is_default && (
                <button
                  onClick={() => onSelect(email.id)}
                  className="inline-flex items-center gap-1 rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                >
                  <CheckCircle className="h-4 w-4" /> Chọn
                </button>
              )}
            </div>
          ))}
          {emails.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-500">
              Chưa có email nào để chọn
            </p>
          )}
        </div>

        <div className="mt-4 text-right">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectEmailModal;
