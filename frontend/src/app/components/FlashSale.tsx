import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type ProductRaw = {
  id: number;
  slug?: string;
  name: string;
  media?: { url: string; is_primary?: boolean }[];
  base_price?: string;
  variants?: { price: string }[];
  brand?: { name: string };
  originalPrice?: string; // nếu API có
};

export type ProductFlashSaleItem = {
  id: number;
  name: string;
  slug?: string;
  image: string;
  price: number;
  originalPrice?: number;
  brandName?: string;
};

type ProductFlashSaleProps = {
  title?: string;
  seeAllHref?: string;
  className?: string;
  skeletonCount?: number;
};

function formatVND(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + "đ";
}

export default function ProductFlashSale({
  title = "Flash Sale",
  seeAllHref = "#",
  className = "",
  skeletonCount = 8,
}: ProductFlashSaleProps) {
  const [data, setData] = useState<ProductFlashSaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancel = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:3000/products", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const json: ProductRaw[] = await res.json();

        const mapped: ProductFlashSaleItem[] = json.map((p) => {
          const primaryMedia = p.media?.find((m) => m.is_primary) || p.media?.[0];
          const mainVariant = p.variants?.[0];
          return {
            id: p.id,
            slug: p.slug,
            name: p.name,
            image: primaryMedia?.url || "https://via.placeholder.com/110?text=No+Image",
            price: Number(mainVariant?.price || p.base_price || 0),
            originalPrice: p.originalPrice ? Number(p.originalPrice) : undefined,
            brandName: p.brand?.name,
          };
        });

        if (!cancel) setData(mapped);
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancel) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      cancel = true;
    };
  }, []);

  const scrollByCards = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    const CARD = 176;
    el.scrollBy({ left: dir * CARD * 3, behavior: "smooth" });
  };

  const handleClick = (slug?: string) => {
    if (!slug) return;
    navigate(`/products/slug/${slug}`);
  };

  return (
    <section className={`rounded-2xl bg-white ring-1 ring-slate-200 shadow ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <a href={seeAllHref} className="text-sm text-sky-600 hover:underline">
          Xem tất cả
        </a>
      </div>

      {/* Track */}
      <div className="relative px-2 pb-3">
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory no-scrollbar px-2 pb-2"
          style={{ scrollbarWidth: "none" }}
        >
          <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

          {loading &&
            Array.from({ length: skeletonCount }).map((_, i) => (
              <div
                key={i}
                className="snap-start w-[160px] shrink-0 animate-pulse rounded-xl bg-slate-100 h-[180px]"
              />
            ))}

          {!loading &&
            data.map((p) => {
              const discount =
                p.originalPrice !== undefined
                  ? Math.round((1 - p.price / p.originalPrice) * 100)
                  : undefined;

              return (
                <div
                  key={p.id}
                  className="snap-start w-[160px] shrink-0 rounded-xl bg-white ring-1 ring-slate-200/70 hover:ring-slate-300 shadow-sm px-3 pt-3 pb-2 transition cursor-pointer"
                  onClick={() => handleClick(p.slug)}
                >
                  <div className="relative">
                    {typeof discount === "number" && (
                      <span className="absolute left-0 top-0 -translate-y-1.5 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-500 ring-1 ring-rose-100">
                        -{discount}%
                      </span>
                    )}
                    <img
                      src={p.image}
                      alt={p.name}
                      className="mx-auto block h-[110px] w-[110px] rounded-lg object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          "https://via.placeholder.com/110?text=%20";
                      }}
                    />
                  </div>

                  <h3 className="font-medium">{p.name}</h3>

                  <div className="mt-2 text-center">
                    <div className="text-[13px] font-semibold text-rose-600">{formatVND(p.price)}</div>
                    {p.originalPrice && (
                      <div className="text-[11px] text-slate-400 line-through">{formatVND(p.originalPrice)}</div>
                    )}
                    {p.brandName && <div className="text-[11px] text-slate-400">{p.brandName}</div>}
                  </div>

                  <button className="mt-2 w-full rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-black/90">
                    Mua Ngay
                  </button>
                </div>
              );
            })}
        </div>

        {/* Arrows */}
        {data.length > 6 && (
          <>
            <button
              aria-label="Prev"
              onClick={() => scrollByCards(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 ml-1 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow ring-1 ring-slate-200 hover:bg-white text-sky-600"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            <button
              aria-label="Next"
              onClick={() => scrollByCards(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 mr-1 grid h-8 w-8 place-items-center rounded-full bg-white/90 shadow ring-1 ring-slate-200 hover:bg-white text-sky-600"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </>
        )}
      </div>
    </section>
  );
}
