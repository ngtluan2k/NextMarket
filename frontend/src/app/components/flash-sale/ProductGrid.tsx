"use client";
import React, { useMemo } from "react";
import type { Product } from "./types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  activeCategoryId,
  onAddToCart,
  title = "Sản Phẩm Hot",
}: {
  products: Product[];
  activeCategoryId: string;
  onAddToCart?: (p: Product) => void;
  title?: string;
}) {
  const filtered = useMemo(() => {
    if (activeCategoryId === "all") return products;
    return products.filter((p) => p.categoryId === activeCategoryId);
  }, [products, activeCategoryId]);

  return (
    <section id="products">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold md:text-3xl">{title}</h2>
        <span className="text-sm text-gray-500">{filtered.length} sản phẩm</span>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
        ))}
      </div>
    </section>
  );
}
