
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

type ProductRaw = {
  id: number;
  slug: string; // cần slug từ API
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
  containerClassName?: string; // class cho grid container
  cardClassName?: string; // class cho từng card
};

export default function ProductGridToday({ containerClassName = "", cardClassName = "" }: Props) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("http://localhost:3000/products");
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data: ProductRaw[] = await res.json();

        const mapped: ProductCardData[] = data.map((p) => {
          const primaryMedia = p.media?.find((m) => m.is_primary) || p.media?.[0];
          const mainVariant = p.variants?.[0];
          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            image: primaryMedia?.url || "https://via.placeholder.com/220x220?text=No+Image",
            price: mainVariant?.price || p.base_price || "0",
            brandName: p.brand?.name,
          
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
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${containerClassName}`}>
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
            {p.brandName && <p className="text-xs text-slate-500">{p.brandName}</p>}
            <p className="mt-1 text-sm font-semibold">{Number(p.price).toLocaleString("vi-VN")}đ</p>
          </div>

          {/* <button
            onClick={() => handleAddToCart(p)}
            className="mt-2 w-full rounded-md bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700 transition"
          >
            Thêm vào giỏ
          </button> */}
        </div>
      ))}
    </div>
  );
}
