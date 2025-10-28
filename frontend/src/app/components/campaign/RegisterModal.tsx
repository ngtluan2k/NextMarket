import React, { useEffect, useMemo, useState } from 'react';
import type { Product } from '../../../service/product.service';

type Item = { productId: number; variantId?: number };

type Props = {
  open: boolean;
  products: Product[];
  onClose: () => void;
  onConfirm: (items: Item[]) => void;
};

export default function RegisterModal({ open, products, onClose, onConfirm }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Record<number, number[]>>({});

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected({});
    }
  }, [open]);

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    const base = products.filter((p) => p.status === 'active');
    if (!s) return base;
    return base.filter((p) => p.name.toLowerCase().includes(s));
  }, [products, query]);

  const toggle = (pid: number, vid?: number) => {
    setSelected((prev) => {
      const arr = prev[pid] ? [...prev[pid]] : [];
      if (vid == null) {
        // toggle chọn product base (dùng marker 0)
        const has = arr.includes(0);
        return { ...prev, [pid]: has ? arr.filter((x) => x !== 0) : [0] };
      }
      const has = arr.includes(vid);
      const cleaned = arr.filter((x) => x !== 0); // nếu chọn variant thì bỏ marker base
      return { ...prev, [pid]: has ? cleaned.filter((x) => x !== vid) : [...cleaned, vid] };
    });
  };

  const handleConfirm = () => {
    const items: Item[] = [];
    Object.entries(selected).forEach(([pidStr, vids]) => {
      const pid = Number(pidStr);
      if (vids.length === 0) return;
      if (vids.includes(0)) items.push({ productId: pid });
      vids.filter((v) => v !== 0).forEach((v) => items.push({ productId: pid, variantId: v }));
    });
    if (items.length === 0) return onClose();
    onConfirm(items);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-x-0 top-10 mx-auto w-full max-w-2xl rounded-xl bg-white shadow-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-base font-semibold">Chọn sản phẩm tham gia chiến dịch</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="p-5 space-y-3">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm sản phẩm..."
              className="w-full rounded-lg border px-3 py-2 pl-9 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </div>

          <div className="max-h-[360px] overflow-auto pr-1 space-y-3">
            {filtered.length === 0 && (
              <div className="text-sm text-gray-500">Không có sản phẩm phù hợp.</div>
            )}

            {filtered.map((p) => (
              <div key={p.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-500">
                    {p.base_price != null ? `${Number(p.base_price).toLocaleString('vi-VN')}₫` : '—'}
                  </div>
                </div>

                <div className="mt-2 space-y-2">
                  {p.variants && p.variants.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {p.variants.map((v) => (
                        <label key={v.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={!!selected[p.id]?.includes(v.id)}
                            onChange={() => toggle(p.id, v.id)}
                            className="h-4 w-4 accent-sky-600"
                          />
                          <span>
                            {v.variant_name}{' '}
                            {v.price != null && (
                              <>— {Number(v.price).toLocaleString('vi-VN')}₫</>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={!!selected[p.id]?.includes(0)}
                        onChange={() => toggle(p.id)}
                        className="h-4 w-4 accent-sky-600"
                      />
                      <span>
                        Chọn sản phẩm này{' '}
                        {p.base_price != null && (
                          <>— {Number(p.base_price).toLocaleString('vi-VN')}₫</>
                        )}
                      </span>
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t">
          <button onClick={onClose} className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100">
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            className="px-3 py-2 rounded-lg bg-sky-600 text-white hover:bg-sky-700"
          >
            Xác nhận đăng ký
          </button>
        </div>
      </div>
    </div>
  );
}
