import React, { useEffect, useMemo, useState } from "react";
import ProductCard, { ProductItem } from "./ProductCard";
import ProductGridSkeleton from "./ProductCardSkeleton";

type Fetcher = (opts?: {
  brand?: string | null;
  page?: number;
  pageSize?: number;
}) => Promise<ProductItem[] | { items: ProductItem[]; total: number }>;

function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs border transition ${
        active ? "border-sky-500 bg-sky-50 text-sky-700"
               : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function Pager({
  page, total, pageSize, onChange,
}: {
  page: number; total: number; pageSize: number; onChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const makeRange = () => {
    const max = totalPages;
    const arr: number[] = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(max, page + 2);
    for (let i = start; i <= end; i++) arr.push(i);
    if (!arr.includes(1)) arr.unshift(1);
    if (!arr.includes(max)) arr.push(max);
    return Array.from(new Set(arr));
  };

  const numbers = makeRange();

  return (
    <div className="mt-4 flex items-center justify-center gap-2">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className={`rounded-md border px-3 py-1 text-xs ${page === 1 ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"}`}
      >
        ◀ Trước
      </button>

      {numbers.map((n, i) => {
        const prev = numbers[i - 1];
        const needDots = prev && n - prev > 1;
        return (
          <React.Fragment key={n}>
            {needDots && <span className="px-1 text-slate-400 text-xs">…</span>}
            <button
              onClick={() => onChange(n)}
              className={`rounded-md px-3 py-1 text-xs border ${
                n === page ? "border-sky-500 bg-sky-50 text-sky-700"
                           : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {n}
            </button>
          </React.Fragment>
        );
      })}

      <button
        disabled={page === totalPages}
        onClick={() => onChange(page + 1)}
        className={`rounded-md border px-3 py-1 text-xs ${page === totalPages ? "opacity-40 cursor-not-allowed" : "hover:bg-slate-50"}`}
      >
        Sau ▶
      </button>
    </div>
  );
}

export default function ProductGrid({
  title = "Tất cả sản phẩm",
  items,
  fetchProducts,              // server-side optional
  className = "",
  initialPageSize = 16,
}: {
  title?: string;
  items?: ProductItem[];      // mỗi item nên có brand?: string
  fetchProducts?: Fetcher;    // nếu dùng server-side
  className?: string;
  initialPageSize?: number;
}) {
  const [list, setList] = useState<ProductItem[]>(items ?? []);
  const [total, setTotal] = useState<number>(items?.length ?? 0);

  const [loading, setLoading] = useState<boolean>(!!fetchProducts && !items);
  const [error, setError] = useState<string | null>(null);

  // lọc theo thương hiệu
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(initialPageSize);

  // đồng bộ khi items prop thay đổi (client-side mode)
  useEffect(() => {
    if (items && !fetchProducts) {
      setList(items);
      setTotal(items.length);
      setPage(1);
    }
  }, [items, fetchProducts]);

  // load server-side khi có fetcher hoặc khi brand/page đổi
  useEffect(() => {
    if (!fetchProducts) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchProducts({ brand: selectedBrand, page, pageSize });
        if (cancelled) return;
        if (Array.isArray(res)) {
          setList(res);
          setTotal(res.length); // nếu API không trả total, dùng tạm độ dài
        } else {
          setList(res.items ?? []);
          setTotal(res.total ?? res.items?.length ?? 0);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Lỗi tải sản phẩm");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [fetchProducts, selectedBrand, page, pageSize]);

  // danh sách brand lấy từ toàn bộ list hiện có (client-side)
  const brands = useMemo(() => {
    const s = new Set<string>();
    (items ?? list)?.forEach((p: any) => p?.brand && s.add(String(p.brand)));
    return Array.from(s);
  }, [items, list]);

  // client-side filtering + paging
  const displayed = useMemo(() => {
    if (fetchProducts) return list; // server đã trả đúng trang
    const source = selectedBrand ? (items ?? [])?.filter((p: any) => p.brand === selectedBrand) : (items ?? []);
    setTotal(source.length);
    const start = (page - 1) * pageSize;
    return source.slice(start, start + pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list, items, selectedBrand, page, pageSize, fetchProducts]);

  // chọn brand -> reset về trang 1
  const handlePickBrand = (b: string | null) => {
    setSelectedBrand(b);
    setPage(1);
    if (!fetchProducts && items) {
      // list hiển thị sẽ được tính bởi displayed useMemo
    }
  };

  const showSkeleton = loading || (!items && !fetchProducts);

  return (
    <section className={`mt-3 rounded-2xl bg-white ring-1 ring-slate-200 shadow p-4 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base md:text-lg font-semibold text-slate-900">{title}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <Chip active>Phổ biến</Chip>
          <Chip>Mới nhất</Chip>
          <Chip>Giá thấp → cao</Chip>
          <Chip>Giá cao → thấp</Chip>
          <Chip>Đánh giá cao</Chip>
        </div>
      </div>

      {/* Khung thương hiệu */}
      <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <div className="mb-2 text-xs font-medium text-slate-600">Thương hiệu</div>
        <div className="flex w-full gap-2 overflow-x-auto pb-1">
          <Chip active={selectedBrand === null} onClick={() => handlePickBrand(null)}>Tất cả</Chip>
          {brands.map((b) => (
            <Chip key={b} active={selectedBrand === b} onClick={() => handlePickBrand(b)}>
              {b}
            </Chip>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-4">
        {showSkeleton ? (
          <ProductGridSkeleton count={pageSize} />
        ) : error ? (
          <div className="rounded-xl bg-white ring-1 ring-rose-200 p-6 text-center text-rose-600">
            Không tải được sản phẩm. {error}
          </div>
        ) : displayed.length === 0 ? (
          <div className="rounded-xl bg-white ring-1 ring-slate-200 p-6 text-center text-slate-600">
            Không có sản phẩm cho lựa chọn hiện tại.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayed.map((p) => (
                <ProductCard key={p.id} item={p} />
              ))}
            </div>
            <Pager page={page} total={total} pageSize={pageSize} onChange={setPage} />
          </>
        )}
      </div>
    </section>
  );
}
