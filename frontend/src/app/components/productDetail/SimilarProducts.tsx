import React, { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { productService, Product } from "../../../service/product.service"; 

export type SimilarItem = {
  id?: string;
  name?: string;
  image?: string;
  price?: number;
  listPrice?: number;
  rating?: number;
  reviewsCount?: number;
  href?: string;
};

type Props = {
  title?: string;
  productId?: number;
  items?: SimilarItem[];
  loading?: boolean;
  cols?: number;
  rows?: number;
  onOpen?: (item: SimilarItem) => void;
};

const fmt = (n?: number) =>
  (n ?? 0).toLocaleString("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  });

function Stars({ value = 0 }: { value?: number }) {
  const full = Math.floor(Math.max(0, Math.min(5, value)));
  return (
    <div className="flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < full ? "fill-current" : ""}`} />
      ))}
    </div>
  );
}

export default function SimilarProductsCarousel({
  title: initialTitle = "Sản phẩm tương tự",
  productId,
  items: propItems,
  loading: propLoading = false,
  cols = 4,
  rows = 2,
  onOpen,
}: Props) {
  const [fetchedItems, setFetchedItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(propLoading);
  const [error, setError] = useState<string | null>(null);

  // fetch similar products if productId is given and no items passed in
  useEffect(() => {
    if (productId && !propItems) {
      setLoading(true);
      productService
        .getSimilarProducts(productId)
        .then((products) => {
          setFetchedItems(products);
          setError(null);
        })
        .catch((err) => {
          console.error("Failed to fetch similar products:", err);
          setError("Failed to load similar products");
        })
        .finally(() => setLoading(false));
    }
  }, [productId, propItems]);

  // build items (either from props or fetched)
  const items: SimilarItem[] =
    propItems ||
    fetchedItems.map((p) => ({
      id: p.id.toString(),
      name: p.name,
      image: p.media?.find((m) => m.is_primary)?.url || p.media?.[0]?.url,
      price: typeof p.base_price === "string" ? parseFloat(p.base_price) : p.base_price,
      href: `/products/slug/${p.slug}`, // ✅ matches route in App.tsx
    }));

  const title = loading ? initialTitle : `${initialTitle} (${items.length})`;

  const pageSize = Math.max(1, cols * rows);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const [page, setPage] = useState(0);

  const start = page * pageSize;
  const current = useMemo(
    () => items.slice(start, start + pageSize),
    [items, start, pageSize]
  );

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  const slots: Array<SimilarItem & { __ph?: boolean }> = loading
    ? Array.from({ length: pageSize }).map(() => ({ __ph: true }))
    : current.map((item) => item);

  if (error) {
    return (
      <section className="relative rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h3 className="mb-3 text-base font-semibold text-slate-900">{title}</h3>
        <div className="text-center text-slate-500">{error}</div>
      </section>
    );
  }

  return (
    <section className="relative rounded-2xl bg-white p-5 ring-1 ring-slate-200">
      <h3 className="mb-3 text-base font-semibold text-slate-900">{title}</h3>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {slots.map((x, i) =>
          x.__ph ? (
            <div
              key={`ph-${i}`}
              className="rounded-2xl border border-slate-200 p-3 text-left"
            >
              <div className="aspect-[4/4.6] w-full overflow-hidden rounded bg-slate-50 grid place-items-center">
                <div className="text-slate-300 text-sm flex flex-col items-center">
                  <ImageIcon className="mb-1 h-5 w-5" />
                  No image
                </div>
              </div>
            </div>
          ) : (
            <Link
              key={x.id}
              to={x.href!}
              className="rounded-2xl border border-slate-200 p-3 text-left hover:shadow-sm"
            >
              <div className="aspect-[4/4.6] w-full overflow-hidden rounded bg-slate-50 grid place-items-center">
                {x.image ? (
                  <img
                    src={x.image}
                    alt={x.name ?? ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-slate-300 text-sm flex flex-col items-center">
                    <ImageIcon className="mb-1 h-5 w-5" />
                    No image
                  </div>
                )}
              </div>

              <div className="mt-2 line-clamp-2 text-sm text-slate-800">
                {x.name}
              </div>

              <div className="mt-1 flex items-center gap-2">
                <Stars value={x.rating} />
                <span className="text-xs text-slate-500">
                  {x.reviewsCount ?? 0}
                </span>
              </div>

              {x.price ? (
                <div className="mt-1 font-semibold">{fmt(x.price)}</div>
              ) : null}

              {x.listPrice ? (
                <div className="text-xs text-slate-400 line-through">
                  {fmt(x.listPrice)}
                </div>
              ) : null}
            </Link>
          )
        )}
      </div>

      {/* Prev button */}
      <button
        aria-label="Prev"
        onClick={() => canPrev && setPage((p) => p - 1)}
        disabled={!canPrev}
        className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow ring-1 ring-slate-200
                    ${
                      !canPrev
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-slate-50"
                    }`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Next button */}
      <button
        aria-label="Next"
        onClick={() => canNext && setPage((p) => p + 1)}
        disabled={!canNext}
        className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow ring-1 ring-slate-200
                    ${
                      !canNext
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-slate-50"
                    }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Page indicators */}
      <div className="mt-3 flex justify-center gap-1">
        {Array.from({ length: totalPages }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 w-6 rounded-full ${
              i === page ? "bg-slate-600" : "bg-slate-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}