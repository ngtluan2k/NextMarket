import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export type SortKey =
  | 'popular'
  | 'bestseller'
  | 'new'
  | 'priceAsc'
  | 'priceDesc';

export type StoreProduct = {
  id: string | number;
  name: string;
  slug: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  avg_rating?: number;
  sold?: number;
  badges?: string[];
};

export type StoreProductsResponse = {
  items: StoreProduct[];
  total: number;
  page: number;
  pageSize: number;
};

type Props = {
  storeSlug: string;
  categorySlug?: string | null;
  pageSize?: number;
  fetchProducts?: (args: {
    slug: string;
    categorySlug?: string | null;
    page: number;
    pageSize: number;
    sort: SortKey;
  }) => Promise<StoreProductsResponse>;
  className?: string;
};

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'popular', label: 'Phổ biến' },
  { key: 'bestseller', label: 'Bán chạy' },
  { key: 'new', label: 'Hàng mới' },
  { key: 'priceAsc', label: 'Giá thấp đến cao' },
  { key: 'priceDesc', label: 'Giá cao đến thấp' },
];

export default function StoreProductsGrid({
  storeSlug,
  categorySlug,
  pageSize = 20,
  fetchProducts,
  className,
}: Props) {
  const navigate = useNavigate();
  const { search, pathname } = useLocation();
  const params = new URLSearchParams(search);

  const q = params.get('q') ?? '';
  const sort = (params.get('sort') as SortKey) ?? 'popular';
  const page = Math.max(1, Number(params.get('page') || 1));

  const [data, setData] = useState<StoreProductsResponse>({
    items: [],
    total: 0,
    page,
    pageSize,
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const pushParams = (
    next: Partial<{ q: string; sort: SortKey; page: number }>
  ) => {
    const p = new URLSearchParams(search);
    if (next.q !== undefined) p.set('q', next.q);
    if (next.sort !== undefined) p.set('sort', next.sort);
    if (next.page !== undefined) p.set('page', String(next.page));
    navigate(`${pathname}?${p.toString()}`, { replace: false });
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await (fetchProducts ?? defaultFetchProducts)({
          slug: storeSlug,
          categorySlug,
          page,
          pageSize,
          sort,
        });
        if (alive) setData(res);
      } catch (e: any) {
        if (alive) setErr(e.message || 'Không thể tải danh sách sản phẩm');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [storeSlug, categorySlug, page, pageSize, sort, fetchProducts]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((data?.total || 0) / pageSize)),
    [data?.total, pageSize]
  );

  // ==== NEW: helpers cho pagination kiểu «« « 10 11 12 13 14 » »» ====
  const windowPages = useMemo(() => {
    const size = 5; // số trang hiển thị trong “cửa sổ”
    let start = Math.max(1, page - Math.floor(size / 2));
    let end = start + size - 1;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - size + 1);
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [page, totalPages]);

  const goTo = (n: number) => {
    const next = Math.min(totalPages, Math.max(1, n || 1));
    if (next !== page) pushParams({ page: next });
  };

  const [jump, setJump] = useState<string>('');
  // ===================================================================

  return (
    <section
      className={[
        'rounded-2xl border bg-white shadow-sm',
        className || '',
      ].join(' ')}
    >
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div className="text-sm text-slate-600">
          Tất cả sản phẩm{' '}
          <span className="font-medium text-slate-900">
            {data.total.toLocaleString('vi-VN')}
          </span>{' '}
          kết quả
        </div>
        <div className="flex flex-wrap gap-2">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => pushParams({ sort: s.key, page: 1 })}
              className={
                sort === s.key
                  ? 'border-blue-600 bg-blue-50 text-blue-700 rounded-full px-3 py-1.5 text-xs font-medium'
                  : 'border-slate-200 bg-white text-slate-700 rounded-full px-3 py-1.5 text-xs font-medium hover:border-slate-300'
              }
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* grid */}
      <div className="px-3 py-4 sm:px-5">
        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: pageSize }).map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-lg border border-slate-200"
              >
                <div className="h-40 animate-pulse bg-slate-100" />
                <div className="space-y-2 p-3">
                  <div className="h-4 w-5/6 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-3/6 animate-pulse rounded bg-slate-100" />
                  <div className="h-5 w-2/6 animate-pulse rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : err ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        ) : data.items.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
            Không có sản phẩm phù hợp.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
            {data.items.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  const params = new URLSearchParams(window.location.search);
                  const gid = params.get('groupId');

                  const to = gid
                    ? `/products/slug/${p.slug}?groupId=${gid}`
                    : `/products/slug/${p.slug}`;

                  navigate(to, {
                    state: {
                      product: p,
                      groupId: gid ? Number(gid) : null,
                    },
                  });
                }}
                className="cursor-pointer group overflow-hidden rounded-lg border border-slate-200 bg-white hover:-translate-y-[1px] hover:shadow-md transition"
              >
                <div className="relative">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    loading="lazy"
                    className="mx-auto h-44 w-full object-contain p-2"
                  />
                  <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
                    {p.badges?.slice(0, 3).map((b, i) => (
                      <span
                        key={i}
                        className="rounded bg-blue-600/90 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white shadow-sm"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="p-3">
                  <div className="line-clamp-2 min-h-[2.5rem] text-sm text-slate-800 group-hover:text-blue-700">
                    {p.name}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    {typeof p.avg_rating === 'number' && (
                      <span>⭐ {p.avg_rating.toFixed(1)}</span>
                    )}
                    {typeof p.sold === 'number' && (
                      <span>· Đã bán {p.sold.toLocaleString('vi-VN')}</span>
                    )}
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <div className="text-base font-semibold text-red-600">
                      {p.price.toLocaleString('vi-VN')} đ
                    </div>
                    {p.originalPrice && p.originalPrice > p.price && (
                      <div className="text-xs text-slate-400 line-through">
                        {p.originalPrice.toLocaleString('vi-VN')} đ
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* pagination (NEW) */}
        {data.items.length > 0 && totalPages > 1 && (
          <nav
            aria-label="Pagination"
            className="mt-6 flex items-center justify-center gap-3"
          >
            <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1 shadow-sm">
              {/* «« */}
              <button
                onClick={() => goTo(1)}
                disabled={page <= 1}
                className="h-9 min-w-9 px-2 text-base rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Trang đầu"
              >
                ««
              </button>

              {/* « */}
              <button
                onClick={() => goTo(page - 1)}
                disabled={page <= 1}
                className="h-9 min-w-9 px-2 text-base rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Trang trước"
              >
                «
              </button>

              {/* 10 11 12 13 14 */}
              {windowPages.map((pno) => (
                <button
                  key={pno}
                  onClick={() => goTo(pno)}
                  aria-current={pno === page ? 'page' : undefined}
                  className={[
                    'h-9 min-w-9 rounded-full px-3 text-sm transition',
                    pno === page
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  {pno}
                </button>
              ))}

              {/* » */}
              <button
                onClick={() => goTo(page + 1)}
                disabled={page >= totalPages}
                className="h-9 min-w-9 px-2 text-base rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Trang sau"
              >
                »
              </button>

              {/* »» */}
              <button
                onClick={() => goTo(totalPages)}
                disabled={page >= totalPages}
                className="h-9 min-w-9 px-2 text-base rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Trang cuối"
              >
                »»
              </button>

              {/* ô nhập nhanh */}
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={totalPages}
                value={jump}
                onChange={(e) => setJump(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    goTo(Number(jump));
                    setJump('');
                  }
                }}
                onBlur={() => {
                  if (jump) {
                    goTo(Number(jump));
                    setJump('');
                  }
                }}
                placeholder=""
                className="ml-1 h-9 w-14 rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                aria-label="Jump to page"
              />
            </div>

            {/* “of X products” */}
            <div className="text-sm text-slate-500">
              of{' '}
              <span className="font-medium text-slate-700">
                {data.total.toLocaleString('en-US')}
              </span>{' '}
              products
            </div>
          </nav>
        )}
      </div>
    </section>
  );
}

async function defaultFetchProducts({
  slug,
  categorySlug,
  page,
  pageSize,
  sort,
}: {
  slug: string;
  categorySlug?: string | null;
  page: number;
  pageSize: number;
  sort: SortKey;
}): Promise<StoreProductsResponse> {
  // sử dụng API mới
  let url = `http://localhost:3000/stores/slug/${slug}/all`;
  if (categorySlug) url += `?category=${categorySlug}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();

  const items: StoreProduct[] = (json.data || []).map((p: any) => {
    const primaryMedia =
      p.media?.find((m: any) => m.is_primary) || p.media?.[0];
    const imageUrl = primaryMedia?.url
      ? primaryMedia.url.startsWith('http')
        ? primaryMedia.url
        : `http://localhost:3000/${primaryMedia.url.replace(/^\/+/, '')}`
      : '';

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      imageUrl,
      price: Number(p.base_price) || 0,
      originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
      avg_rating: Number(p.avg_rating ?? p.rating ?? 0),
      sold: p.sold ?? 0,
      badges: p.badges ?? [],
    };
  });

  return {
    items,
    total: json.total ?? items.length,
    page,
    pageSize,
  };
}
