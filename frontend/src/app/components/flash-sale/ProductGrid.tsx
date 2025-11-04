
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { ProductCard } from "./ProductCard";
import type { Product } from "../../../service/product.service";

export function ProductGrid({
  activeCategoryId,
  title = "Sản Phẩm Hot",
  apiUrl = "http://localhost:3000/products/flash-sale", // URL API mặc định
}: {
  activeCategoryId: string;
  title?: string;
  apiUrl?: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

useEffect(() => {
  setLoading(true);
  setError(null);

  axios
    .get<Product[]>(apiUrl)
    .then((res) => {
      console.log("Fetch response:", res); // <-- log nguyên response
      console.log("Response data:", res.data); // <-- log riêng dữ liệu
      setProducts(res.data ?? []);
    })
    .catch((err) => {
      console.error("Fetch products error:", err);
      setError("Không tải được sản phẩm");
    })
    .finally(() => setLoading(false));
}, [apiUrl]);

  // filter theo category
  const filtered = useMemo(() => {
    if (!Array.isArray(products)) return [];
    if (activeCategoryId === "all") return products;

    return products.filter((p) =>
      p.categories?.some((c) => String(c.category_id) === activeCategoryId)
    );
  }, [products, activeCategoryId]);

  return (
    <section id="products">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
        <span className="text-sm text-gray-500">{filtered.length} sản phẩm</span>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-xl border bg-gray-50"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
