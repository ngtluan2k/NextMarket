import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X, Check, Layers3, Image as ImageIcon } from 'lucide-react';

type ProductMedia = { id?: number; url: string; is_primary?: boolean; sort_order?: number };
type ProductVariant = { id: number; variant_name: string; price?: number };
type ProductBrand = { name?: string };
export type Product = {
  id: number;
  name: string;
  status: 'active' | 'inactive' | string;
  base_price?: number;
  brand?: ProductBrand;
  media?: ProductMedia[];
  variants?: ProductVariant[];
};

type Item = { productId: number; variantId?: number };

type Props = {
  open: boolean;
  products: Product[];
  onClose: () => void;
  onConfirm: (items: Item[]) => void;
};

function formatVND(n: number | string | null | undefined) {
  const num = Number(n ?? 0);
  if (!Number.isFinite(num) || num <= 0) return '—';
  return `${num.toLocaleString('vi-VN')}₫`;
}

// Lấy URL ảnh của sản phẩm và log ra để debug
function getCoverUrl(p: Product) {
  const arr = p?.media || [];
  const primary = arr.find((m) => m?.is_primary && m?.url);
  
  console.log('Product Media:', arr); // Log danh sách media của sản phẩm
  console.log('Primary Image URL:', primary?.url); // Log URL của ảnh chính

  return primary?.url || arr?.[0]?.url || ''; // Trả về URL hợp lệ hoặc chuỗi rỗng nếu không có ảnh
}

export default function RegisterModal({ open, products, onClose, onConfirm }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Record<number, number[]>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected({});
      setExpanded({});
      setMounted(true);
      setTimeout(() => searchRef.current?.focus(), 120);
    } else {
      setMounted(false);
    }
  }, [open]);

  const normalized: Product[] = useMemo(
    () => (products || []).filter((p) => p.status === 'active'),
    [products]
  );

  const filtered = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return normalized;
    return normalized.filter((p) => {
      const inName = p.name?.toLowerCase().includes(s);
      const inVariant = (p.variants || []).some((v) => v.variant_name?.toLowerCase().includes(s));
      return inName || inVariant;
    });
  }, [normalized, query]);

  const selectedCount = useMemo(() => {
    let count = 0;
    for (const vids of Object.values(selected)) {
      if (!vids || vids.length === 0) continue;
      if (vids.includes(0)) count += 1;
      else count += vids.length;
    }
    return count;
  }, [selected]);

  const isChecked = (pid: number, vid?: number) => {
    const arr = selected[pid] || [];
    return vid == null ? arr.includes(0) : arr.includes(vid);
  };

  const toggle = (pid: number, vid?: number) => {
    setSelected((prev) => {
      const arr = prev[pid] ? [...prev[pid]] : [];
      if (vid == null) {
        const has = arr.includes(0);
        return { ...prev, [pid]: has ? arr.filter((x) => x !== 0) : [0] };
      }
      const has = arr.includes(vid);
      const cleaned = arr.filter((x) => x !== 0); // bỏ marker base khi chọn biến thể
      return { ...prev, [pid]: has ? cleaned.filter((x) => x !== vid) : [...cleaned, vid] };
    });
  };

  const selectAllVariants = (pid: number, variantIds: number[]) => {
    setSelected((prev) => ({ ...prev, [pid]: [...variantIds] }));
  };

  const clearAllForProduct = (pid: number) => {
    setSelected((prev) => {
      const clone = { ...prev };
      delete clone[pid];
      return clone;
    });
  };

  const handleConfirm = () => {
    const items: Item[] = [];
    Object.entries(selected).forEach(([pidStr, vids]) => {
      const pid = Number(pidStr);
      if (!vids || vids.length === 0) return;
      if (vids.includes(0)) items.push({ productId: pid });
      vids.filter((v) => v !== 0).forEach((v) => items.push({ productId: pid, variantId: v }));
    });
    if (items.length === 0) return onClose();
    onConfirm(items);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" aria-modal="true" role="dialog" aria-labelledby="register-title">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${mounted ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      {/* Panel */}
      <div className="absolute inset-0 flex items-start justify-center p-4 sm:p-6">
        <div
          className={`relative w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 transition-all duration-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 bg-white/90 border-b">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-sky-100 text-sky-700">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="register-title" className="text-base sm:text-lg font-semibold text-slate-900">
                    Chọn sản phẩm tham gia chiến dịch
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
                    Tìm, chọn biến thể, hoặc chọn toàn bộ. Nhấn <kbd className="rounded bg-slate-100 px-1 py-0.5">Esc</kbd> để thoát.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                  Đã chọn: <b className="ml-1">{selectedCount}</b>
                </span>
                <button
                  onClick={onClose}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  aria-label="Đóng"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="px-5 pb-4">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm theo tên sản phẩm hoặc biến thể… (Ctrl/⌘+K)"
                  className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-9 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-sky-200"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Xoá từ khoá"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="max-h-[60vh] overflow-y-auto px-5 pb-28 pt-4">
            {filtered.length === 0 ? (
              <div className="grid place-items-center py-16 text-center text-slate-500">
                <div className="rounded-full bg-slate-100 p-4 mb-3">
                  <Search className="h-6 w-6" />
                </div>
                <p className="text-sm">Không có sản phẩm phù hợp.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((p) => {
                  const hasVariants = !!p.variants && p.variants.length > 0;
                  const vIds = hasVariants ? p.variants!.map((v) => v.id) : [];
                  const allSelected = hasVariants && vIds.every((id) => isChecked(p.id, id));
                  const anySelected = hasVariants && vIds.some((id) => isChecked(p.id, id));
                  const openVariants = expanded[p.id] ?? true;

                  return (
                    <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm hover:shadow transition-shadow">
                      <div className="flex items-start gap-3">
                        {/* Cover image */}
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                          {/* Hiển thị ảnh nếu có URL hợp lệ */}
                          {getCoverUrl(p) ? (
                            <img src={getCoverUrl(p)!} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-400">
                              <ImageIcon className="h-6 w-6" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="truncate font-medium text-slate-900">{p.name}</div>
                              <div className="mt-0.5 text-xs text-slate-500 flex items-center gap-2">
                                <span>{formatVND(p.base_price)}</span>
                                {p?.brand?.name && (
                                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                                    {p.brand.name}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              {hasVariants ? (
                                <button
                                  onClick={() =>
                                    allSelected ? clearAllForProduct(p.id) : selectAllVariants(p.id, vIds)
                                  }
                                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                                    allSelected
                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      : anySelected
                                      ? 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100'
                                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                  }`}
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  {allSelected ? 'Bỏ chọn tất cả' : anySelected ? 'Chọn tất cả còn lại' : 'Chọn tất cả'}
                                </button>
                              ) : (
                                <label className="inline-flex select-none items-center gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={!!selected[p.id]?.includes(0)}
                                    onChange={() => toggle(p.id)}
                                    className="h-4 w-4 accent-sky-600"
                                  />
                                  <span>Chọn sản phẩm này</span>
                                </label>
                              )}
                            </div>
                          </div>

                          {/* Variants */}
                          {hasVariants && openVariants && (
                            <div id={`variants-${p.id}`} className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {p.variants!.map((v) => (
                                <label
                                  key={v.id}
                                  className="group flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-sm hover:bg-slate-50"
                                >
                                  <input
                                    type="checkbox"
                                    checked={!!selected[p.id]?.includes(v.id)}
                                    onChange={() => toggle(p.id, v.id)}
                                    className="h-4 w-4 accent-sky-600"
                                  />
                                  <span className="truncate">
                                    <span className="font-medium text-slate-800">{v.variant_name}</span>{' '}
                                    <span className="text-slate-500">— {formatVND(v.price)}</span>
                                  </span>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 select-none bg-gradient-to-t from-white to-white/70 p-0.5" />
          <div className="sticky bottom-0 z-10 border-t bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <div className="flex items-center justify-between gap-2 px-5 py-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs sm:text-sm text-slate-700">
                  Đã chọn: <b className="ml-1">{selectedCount}</b>
                </span>
                {selectedCount > 0 && (
                  <button
                    onClick={() => setSelected({})}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    Xoá tất cả lựa chọn
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={selectedCount === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> Xác nhận đăng ký
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
