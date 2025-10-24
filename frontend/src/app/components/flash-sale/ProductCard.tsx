import React from "react";
import { Star } from "lucide-react";
import type { Product } from "./types";
import { useNavigate } from "react-router-dom";

const formatVND = (n?: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n ?? 0);

export function ProductCard({
  product,
  // onAddToCart,  // giữ prop nhưng KHÔNG dùng nữa, tránh sửa chỗ khác
}: {
  product: Product;
  onAddToCart?: (p: Product) => void;
}) {
  const navigate = useNavigate();

  // Ưu tiên slug, fallback theo id
  const to =
    (product as any).slug
      ? `/product/${(product as any).slug}`
      : product.id != null
      ? `/product/${product.id}`
      : undefined;

  const goDetail = () => {
    if (to) navigate(to);
  };

  return (
    <div
      className="group overflow-hidden rounded-xl border bg-white transition-all hover:shadow-lg cursor-pointer"
      onClick={goDetail}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && to) {
          e.preventDefault();
          navigate(to);
        }
      }}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://via.placeholder.com/600x600?text=No+Image";
          }}
        />
        {typeof (product as any).discount === "number" && (
          <div className="absolute left-2 top-2 rounded-md bg-indigo-600 px-2 py-1 text-xs font-bold text-white">
            -{(product as any).discount}%
          </div>
        )}
      </div>

      <div className="p-3 md:p-4">
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold md:text-base">{product.name}</h3>

        <div className="mb-2 inline-flex items-center gap-1 text-yellow-500">
          <Star className="h-3 w-3 fill-current md:h-4 md:w-4" />
          <span className="text-xs font-medium md:text-sm text-gray-900">
            {product.rating?.toFixed?.(1) ?? "5.0"}
          </span>
          <span className="text-xs text-gray-500">| Đã bán {product.sold ?? 0}</span>
        </div>

        <div className="mb-1 flex items-baseline gap-2">
          <span className="text-base font-bold text-indigo-600 md:text-lg">
            {formatVND((product as any).salePrice ?? (product as any).price)}
          </span>
          {(product as any).originalPrice != null && (
            <span className="text-xs text-gray-400 line-through md:text-sm">
              {formatVND((product as any).originalPrice)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
