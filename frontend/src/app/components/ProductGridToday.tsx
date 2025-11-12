import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rate } from 'antd';

type ProductRaw = {
  id: number;
  slug: string;
  name: string;
  media?: { url: string; is_primary?: boolean }[];
  base_price?: string;
  variants?: { price: string }[];
  brand?: { name: string };
  avg_rating?: number; 
};

type ProductCardData = {
  id: number;
  slug: string;
  name: string;
  image: string;
  price: string;
  brandName?: string;
  avg_rating?: number;  
};

type Props = {
  containerClassName?: string;
  cardClassName?: string;
};

export default function ProductGridToday({
  containerClassName = '',
  cardClassName = '',
}: Props) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${BE_BASE_URL}/products`);
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data: ProductRaw[] = await res.json();

        const mapped: ProductCardData[] = data.map((p) => {
          const primaryMedia =
            p.media?.find((m) => m.is_primary) || p.media?.[0];
          const mainVariant = p.variants?.[0];
          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            image: primaryMedia?.url
              ? primaryMedia.url.startsWith('http')
                ? primaryMedia.url // đã là URL web
                : `${BE_BASE_URL}/${primaryMedia.url.replace(
                    /^\/+/,
                    ''
                  )}` // đường dẫn local
              : '',

            price: mainVariant?.price || p.base_price || '0',
            brandName: p.brand?.name,
            avg_rating: Number(p.avg_rating ?? 0),

          };
        });

        if (!cancelled) setProducts(mapped);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Không tải được sản phẩm');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div>Đang tải sản phẩm…</div>;
  if (error) return <div className="text-red-500">Lỗi: {error}</div>;
  if (products.length === 0) return <div>Chưa có sản phẩm.</div>;

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${containerClassName}`}
    >
      <h3 className="col-span-full text-lg font-bold">Sản phẩm hôm nay</h3>
      {products.map((p) => (
        <div
          key={p.id}
          className={`rounded-xl border border-slate-200 bg-white p-2 hover:shadow-md transition-shadow ${cardClassName}`}
        >
          <div
            className="cursor-pointer"
            onClick={() => navigate(`/products/slug/${p.slug}`)}
          >
            <img
              src={p.image}
              alt={p.name}
              className="w-full aspect-square object-cover rounded-lg"
            />
            <h3 className="mt-2 text-sm font-bold line-clamp-2">{p.name}</h3>
            {p.brandName && (
              <p className="text-xs text-slate-500">{p.brandName}</p>
            )}
            <p className="mt-1 text-sm font-semibold">
              {Number(p.price).toLocaleString('vi-VN')}đ
            </p>
          
            <div className="mt-1 flex items-center gap-1">
              <Rate disabled allowHalf value={p.avg_rating} style={{ fontSize: 14 }} />
              <span className="text-xs text-slate-500">
                ({p.avg_rating?.toFixed(1) ?? 0})
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}