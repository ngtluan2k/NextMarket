import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type ProductRaw = {
  id: number;
  slug: string;
  name: string;
  media?: { url: string; is_primary?: boolean }[];
  base_price?: string;
  variants?: { price: string }[];
  brand?: { name: string };
};

type ProductCardData = {
  id: number;
  slug: string;
  name: string;
  image: string;
  price: string;
  brandName?: string;
};

type Props = {
  containerClassName?: string;
  cardClassName?: string;
};

const ph = (w = 300, h = 300) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
       <rect width='100%' height='100%' rx='16' fill='#F1F5F9'/>
       <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
             font-family='system-ui,Segoe UI,Roboto' font-size='12' fill='#94A3B8'>No image</text>
     </svg>`
  );

const toVND = (n: number | string | null | undefined) => {
  const num = typeof n === 'string' ? Number(n) : n ?? 0;
  if (!Number.isFinite(num)) return '—';
  return new Intl.NumberFormat('vi-VN').format(num) + 'đ';
};

export default function ProductGridToday({
  containerClassName = '',
  cardClassName = '',
}: Props) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('http://localhost:3000/products');
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data: ProductRaw[] = await res.json();

        const mapped: ProductCardData[] = data.map((p) => {
          const primary = p.media?.find((m) => m.is_primary) || p.media?.[0];
          const image = primary?.url
            ? primary.url.startsWith('http')
              ? primary.url
              : `http://localhost:3000/${primary.url.replace(/^\/+/, '')}`
            : ph();
          const price = p.variants?.[0]?.price || p.base_price || '0';

          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            image,
            price,
            brandName: p.brand?.name,
          };
        });

        if (!cancelled) setProducts(mapped);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Không tải được sản phẩm');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const goDetail = (slug: string) => navigate(`/products/slug/${slug}`);
  const buyNow = (slug: string) => navigate(`/products/slug/${slug}?buyNow=1`);

  if (loading) return <div>Đang tải sản phẩm…</div>;
  if (error) return <div className="text-red-500">Lỗi: {error}</div>;
  if (!products.length) return <div>Chưa có sản phẩm.</div>;

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${containerClassName}`}>
      <h3 className="col-span-full text-lg font-bold">Sản phẩm hôm nay</h3>

      {products.map((p) => (
        <div
          key={p.id}
          className={`group rounded-2xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition
                      flex flex-col h-[360px] sm:h-[360px] md:h-[380px] ${cardClassName}`}
        >
          {/* TOP: ảnh + info */}
          <div className="flex-1 cursor-pointer" onClick={() => goDetail(p.slug)}>
            {/* khung ảnh cố định cao để các card đều nhau */}
            <div className="rounded-xl bg-slate-50 overflow-hidden h-[160px] sm:h-[170px] md:h-[180px] grid place-items-center">
              <img
                src={p.image}
                alt={p.name}
                className="max-h-full w-full object-contain"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (img.dataset.fallback !== '1') {
                    img.src = ph();
                    img.dataset.fallback = '1';
                  }
                }}
              />
            </div>

            {/* text block giữ độ cao ổn định */}
            <div className="mt-2">
              <h3
                className="text-sm font-semibold text-slate-900 leading-5 line-clamp-2"
                style={{ minHeight: 40 }} // ~ 2 dòng
                title={p.name}
              >
                {p.name}
              </h3>
              <div className="h-4 text-xs text-slate-500">{p.brandName ?? ''}</div>
              <div className="h-5 text-sm font-semibold text-rose-600">{toVND(p.price)}</div>
            </div>
          </div>

          {/* BOTTOM: nút mua – nhỏ gọn, ở giữa, giống mẫu */}
          <button
            className="mx-auto mt-3 mb-1 inline-flex h-8 w-[76%] max-w-[170px]
                       items-center justify-center rounded-[10px] bg-[#0f172a]
                       text-white text-[13px] font-semibold leading-none
                       ring-1 ring-white/10 shadow-[0_12px_20px_-12px_rgba(2,6,23,.5)]
                       hover:bg-[#0b1324] active:translate-y-[1px]"
            onClick={(e) => {
              e.stopPropagation();
              buyNow(p.slug);
            }}
            aria-label={`Mua ngay ${p.name}`}
          >
            Mua Ngay
          </button>
        </div>
      ))}
    </div>
  );
}
