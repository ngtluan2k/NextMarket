import React from 'react';
import { Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ProductCardType {
  id: number | string;
  uuid: string;
  name: string;
  slug?: string;
  media?: Array<{ url: string }>;
  avg_rating?: number | string;
  review_count?: number;
  pricing_rules?: Array<{ type: string; price: number | string }>;
}

const formatVND = (n?: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
    n ?? 0
  );

export function ProductCard({ product }: { product: ProductCardType }) {
  const navigate = useNavigate();

  // Ưu tiên slug, fallback theo id
  const to = product.slug
    ? `/products/slug/${product.slug}`
    : product.id
    ? `/product/${product.id}`
    : undefined;
  const goDetail = () => {
    if (to) navigate(to);
  };

  // Lấy giá flash sale nếu có
  const flashPrice =
    product.pricing_rules?.find((r) => r.type === 'flash_sale')?.price ?? 0;
  const mediaUrl = product.media?.[0]?.url
    ? `http://localhost:3000${product.media[0].url}`
    : '';
  return (
    <div
      className="group overflow-hidden rounded-xl border bg-white transition-all hover:shadow-lg cursor-pointer"
      onClick={goDetail}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && to) {
          e.preventDefault();
          navigate(to);
        }
      }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={mediaUrl}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '';
          }}
        />
      </div>

      {/* Info */}
      <div className="p-3 md:p-4">
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold md:text-base">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="mb-2 inline-flex items-center gap-1 text-yellow-500">
          <Star className="h-3 w-3 fill-current md:h-4 md:w-4" />
          <span className="text-xs font-medium md:text-sm text-gray-900">
            {Number(product.avg_rating ?? 5).toFixed(1)}
          </span>
          <span className="text-xs text-gray-500">
            | {product.review_count ?? 0}
          </span>
        </div>

        {/* Price */}
        <div className="mb-1 flex items-baseline gap-2">
          <span className="text-base font-bold text-indigo-600 md:text-lg">
            {formatVND(Number(flashPrice))}
          </span>
        </div>
      </div>
    </div>
  );
}
