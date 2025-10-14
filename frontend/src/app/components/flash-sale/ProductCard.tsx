import React from "react";
import { Star, ShoppingCart } from "lucide-react";
import type { Product } from "./types";

const formatVND = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export function ProductCard({ product, onAddToCart }: {
  product: Product;
  onAddToCart?: (p: Product) => void;
}) {
  return (
    <div className="group overflow-hidden rounded-xl border bg-white transition-all hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {typeof product.discount === "number" && (
          <div className="absolute left-2 top-2 rounded-md bg-indigo-600 px-2 py-1 text-xs font-bold text-white">
            -{product.discount}%
          </div>
        )}
      </div>
      <div className="p-3 md:p-4">
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold md:text-base">{product.name}</h3>
        <div className="mb-2 inline-flex items-center gap-1 text-yellow-500">
          <Star className="h-3 w-3 fill-current md:h-4 md:w-4" />
          <span className="text-xs font-medium md:text-sm text-gray-900">{product.rating?.toFixed(1)}</span>
          <span className="text-xs text-gray-500">| Đã bán {product.sold}</span>
        </div>
        <div className="mb-3 flex items-baseline gap-2">
          <span className="text-base font-bold text-indigo-600 md:text-lg">{formatVND(product.salePrice)}</span>
          <span className="text-xs text-gray-400 line-through md:text-sm">{formatVND(product.originalPrice)}</span>
        </div>
        <button
          onClick={() => onAddToCart?.(product)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <ShoppingCart className="h-4 w-4" />
          Thêm Vào Giỏ
        </button>
      </div>
    </div>
  );
}
