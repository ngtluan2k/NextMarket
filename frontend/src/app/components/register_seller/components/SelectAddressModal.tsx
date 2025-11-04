import React from 'react';
import { X, CheckCircle2, User, Phone, MapPin } from 'lucide-react';

interface Address {
  id: number;
  recipient_name: string;
  phone: string;
  street: string;
  district?: string;
  province?: string;
  postal_code?: string;
  detail?: string;
  is_default?: boolean;
}

interface SelectAddressModalProps {
  open: boolean;
  addresses: Address[];
  onClose: () => void;
  onSelect: (id: number) => void;
}

const SelectAddressModal: React.FC<SelectAddressModalProps> = ({
  open,
  addresses,
  onClose,
  onSelect,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-100 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 className="text-sm font-semibold text-slate-800">
            Chọn địa chỉ
          </h3>
          <button
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-3">
          {addresses.length === 0 && (
            <p className="text-sm text-slate-500 text-center">
              Chưa có địa chỉ nào.
            </p>
          )}

          {addresses.map((addr) => {
            const addressLine = [addr.street, addr.district, addr.province]
              .filter(Boolean)
              .join(', ');
            const isDefault = !!addr.is_default;

            return (
              <div
                key={addr.id}
                className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100 transition"
              >
                <div className="text-sm text-slate-800">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="flex items-center gap-1.5 font-medium text-sky-700">
                      <User className="h-4 w-4" />
                      {addr.recipient_name}
                    </span>
                    {isDefault && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                        Mặc định
                      </span>
                    )}
                  </div>
                  <div className="mb-0.5 flex items-center gap-1 text-xs text-slate-600">
                    <Phone className="h-4 w-4" />
                    {addr.phone}
                  </div>
                  <div className="flex items-start gap-1 text-xs text-slate-700">
                    <MapPin className="mt-0.5 h-4 w-4" />
                    <span>
                      {addressLine}
                      {addr.postal_code ? ` - ${addr.postal_code}` : ''}
                    </span>
                  </div>
                  {addr.detail && (
                    <div className="mt-0.5 text-xs text-slate-500">{addr.detail}</div>
                  )}
                </div>

                <button
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium
                    ${isDefault
                      ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  onClick={() => !isDefault && onSelect(addr.id)}
                  disabled={isDefault}
                  title={isDefault ? 'Đang là địa chỉ mặc định' : 'Đặt làm mặc định'}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {isDefault ? 'Đang dùng' : 'Chọn'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SelectAddressModal;
