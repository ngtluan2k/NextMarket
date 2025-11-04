// src/components/ProductCard.tsx
import React from 'react';
import { Rate } from 'antd';
export interface Product {
  id: number;
  name: string;
  slug?: string;
  price: number;
  image?: string;
  brandId?: number;
  brandName?: string;
  categoryId?: number;
  categoryName?: string;
  avg_rating?: number;
}

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2 hover:shadow-md transition-shadow">
      <div className="cursor-pointer">
        <img
          src={
            product.image
          }
          alt={product.name}
          className="w-full aspect-square object-cover rounded-lg"
        />
        <h3 className="mt-2 text-sm font-bold line-clamp-2">{product.name}</h3>
        {product.brandName && (
          <p className="text-xs text-slate-500">{product.brandName}</p>
        )}
        <p className="mt-1 text-sm font-semibold">
          {product.price.toLocaleString()}₫
        </p>
        {/* ⭐ hiển thị sao trung bình */}
            <div className="mt-1 flex items-center gap-1">
              <Rate disabled allowHalf value={product.avg_rating} style={{ fontSize: 14 }} />
              <span className="text-xs text-slate-500">
                ({product.avg_rating?.toFixed(1) ?? 0})
              </span>
            </div>
      </div>
    </div>
  );
};

export default ProductCard;
