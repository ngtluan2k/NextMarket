// src/components/products/ProductGrid.tsx
import React, { useEffect, useState } from 'react';
import ProductCard, { ProductItem } from './ProductCard';
import ProductGridSkeleton from './ProductCardSkeleton';

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs border transition ${
        active
          ? 'border-sky-500 bg-sky-50 text-sky-700'
          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  );
}

export default function ProductGrid({
  title = 'Tất cả sản phẩm',
  items,
  fetchProducts,
  className = '',
}: {
  title?: string;
  items?: ProductItem[];
  fetchProducts?: () => Promise<ProductItem[]>;
  className?: string;
}) {
  const [list, setList] = useState<ProductItem[]>(items ?? []);
  const [loading, setLoading] = useState<boolean>(!!fetchProducts);
  const [error, setError] = useState<string | null>(null);

  // đồng bộ khi items prop thay đổi
  useEffect(() => {
    if (items) setList(items);
  }, [items]);

  useEffect(() => {
    if (!fetchProducts) return;
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        setLoading(true);
        const data = await fetchProducts();
        if (!cancelled) setList(data ?? []);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Lỗi tải sản phẩm');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchProducts]);

  const showSkeleton = loading || (!items && !fetchProducts);

  return (
    <section
      className={`mt-3 rounded-2xl bg-white ring-1 ring-slate-200 shadow p-4 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base md:text-lg font-semibold text-slate-900">
          {title}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          <Chip active>Phổ biến</Chip>
          <Chip>Mới nhất</Chip>
          <Chip>Giá thấp → cao</Chip>
          <Chip>Giá cao → thấp</Chip>
          <Chip>Đánh giá cao</Chip>
        </div>
      </div>

      <div className="mt-4">
        {showSkeleton ? (
          <ProductGridSkeleton count={16} />
        ) : error ? (
          <div className="rounded-xl bg-white ring-1 ring-rose-200 p-6 text-center text-rose-600">
            Không tải được sản phẩm. {error}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-6 text-center text-slate-600">
            Chưa có sản phẩm để hiển thị.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {list.map((p) => (
              <ProductCard key={p.id} item={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
