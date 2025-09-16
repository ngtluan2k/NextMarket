import React from "react";

export type FlashSaleItem = {
  id: string | number;
  name?: string;
  imageUrl: string;
  price: number;              // giá đã giảm
  originalPrice?: number;     // giá gốc (optional)
  discountPercent?: number;   // % giảm (optional, tự tính nếu không truyền)
  href?: string;
};

export type FlashSaleProps = {
  title?: string;
  items?: FlashSaleItem[];                         // có thể bỏ trống -> placeholder
  fetchItems?: () => Promise<FlashSaleItem[]>;     // truyền vào khi có API
  seeAllHref?: string;
  className?: string;
};

function formatVND(n: number) {
  try {
    return new Intl.NumberFormat("vi-VN").format(n) + "đ";
  } catch {
    return n.toLocaleString("vi-VN") + "đ";
  }
}

const PLACEHOLDERS: FlashSaleItem[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `ph-${i}`,
  imageUrl:
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'>
        <rect width='100%' height='100%' rx='16' fill='#F1F5F9'/>
        <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
          font-family='system-ui,Segoe UI,Roboto' font-size='12' fill='#94A3B8'>Image</text>
      </svg>`
    ),
  price: 3579000,
  discountPercent: 28,
}));

export default function FlashSale({
  title = "Flash Sale",
  items,
  fetchItems,
  seeAllHref = "#",
  className = "",
}: FlashSaleProps) {
  const [data, setData] = React.useState<FlashSaleItem[]>(items ?? PLACEHOLDERS);
  const [loading, setLoading] = React.useState<boolean>(!!fetchItems);

  const trackRef = React.useRef<HTMLDivElement>(null);

  // Tự fetch khi có API
  React.useEffect(() => {
    let cancel = false;
    (async () => {
      if (!fetchItems) return;
      try {
        setLoading(true);
        const res = await fetchItems();
        if (!cancel && Array.isArray(res) && res.length) setData(res);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [fetchItems]);

  // Nếu props items thay đổi (ví dụ API ở cha), đồng bộ lại
  React.useEffect(() => {
    if (items) setData(items);
  }, [items]);

  const scrollByCards = (dir: number) => {
    const el = trackRef.current;
    if (!el) return;
    const CARD = 176; // ~width 160 + gap
    el.scrollBy({ left: dir * CARD * 3, behavior: "smooth" });
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

      {/* Content */}
      <div className="relative px-2 pb-3">
        {/* Track */}
        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto scroll-smooth px-2 pb-2 snap-x snap-mandatory
                     [scrollbar-width:none] [-ms-overflow-style:none]"
          style={{ scrollbarWidth: "none" }}
        >
          {/* hide scrollbar for webkit */}
          <style>{`
            .no-scrollbar::-webkit-scrollbar { display: none; }
          `}</style>

          {data.map((p) => {
            // tính % giảm nếu thiếu
            const discount =
              typeof p.discountPercent === "number"
                ? p.discountPercent
                : p.originalPrice
                ? Math.round((1 - p.price / p.originalPrice) * 100)
                : undefined;

            return (
              <a
                key={p.id}
                href={p.href || "#"}
                className="snap-start w-[160px] shrink-0 rounded-xl bg-white ring-1 ring-slate-200/70
                           hover:ring-slate-300 shadow-sm px-3 pt-3 pb-2 transition"
              >
                <div className="relative">
                  {typeof discount === "number" && (
                    <span className="absolute left-0 top-0 translate-y-[-6px] rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-500 ring-1 ring-rose-100">
                      -{discount}%
                    </span>
                  )}
                  <img
                    src={p.imageUrl}
                    alt={p.name || "Sản phẩm"}
                    className="mx-auto block h-[110px] w-[110px] rounded-lg object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://via.placeholder.com/110?text=%20";
                    }}
                  />
                </div>

                {/* Giá */}
                <div className="mt-2 text-center">
                  <div className="text-[13px] font-semibold text-rose-600">
                    {formatVND(p.price)}
                  </div>
                  {p.originalPrice && (
                    <div className="text-[11px] text-slate-400 line-through">
                      {formatVND(p.originalPrice)}
                    </div>
                  )}
                </div>

                {/* CTA */}
                <button
                  className="mt-2 w-full rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white
                             hover:bg-black/90"
                >
                  Mua Ngay
                </button>
              </a>
            );
          })}
        </div>

        {/* Arrows (ẩn nếu ít item) */}
        {data.length > 6 && (
          <>
            <button
              aria-label="Prev"
              onClick={() => scrollByCards(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 ml-1 grid h-8 w-8 place-items-center
                         rounded-full bg-white/90 shadow ring-1 ring-slate-200 hover:bg-white text-sky-600"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
            <button
              aria-label="Next"
              onClick={() => scrollByCards(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 mr-1 grid h-8 w-8 place-items-center
                         rounded-full bg-white/90 shadow  ring-1 ring-slate-200 hover:bg-white text-sky-600"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" />
              </svg>
            </button>
          </>
        )}

        {/* Loading bar nhỏ */}
        {loading && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
        )}
      </div>
    </section>
  );
}
