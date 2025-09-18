import React from 'react';
import { useNavigate } from 'react-router-dom';

type ProductRaw = {
  id: number;
  slug: string;
  name: string;
  media?: { url: string; is_primary?: boolean }[];
  base_price?: string;
  variants?: { price: string }[];
  brand?: { name: string };
  categories?: { category_id: number }[];
};

type ProductCardData = {
  id: number;
  slug: string;
  name: string;
  image: string;
  price: string;
  brandName?: string;
  categories?: number[];
};

type Props = {
  products: ProductRaw[];
};

export default function ProductCardGrid({ products }: Props) {
  const navigate = useNavigate();

  // map raw API => dữ liệu hiển thị
  const mapped: ProductCardData[] = products.map((p) => {
    const primaryMedia = p.media?.find((m) => m.is_primary) || p.media?.[0];
    const mainVariant = p.variants?.[0];
    const categoryIds = p.categories?.map((c) => c.category_id) || [];

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      image:
        primaryMedia?.url ||
        'https://via.placeholder.com/220x220?text=No+Image',
      price: mainVariant?.price || p.base_price || '0',
      brandName: p.brand?.name,
      categories: categoryIds,
    };
  });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {mapped.map((p) => (
        <div
          key={p.id}
          className="rounded-xl border border-slate-200 bg-white p-2 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate(`/product/${p.slug}`)}
        >
          <img
            src={p.image}
            alt={p.name}
            className="w-full aspect-square object-cover rounded-lg"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://via.placeholder.com/220x220?text=No+Image';
            }}
          />
          <h3 className="mt-2 text-sm font-bold line-clamp-2">{p.name}</h3>
          {p.brandName && (
            <p className="text-xs text-slate-500">{p.brandName}</p>
          )}
          <p className="mt-1 text-sm font-semibold">
            {Number(p.price).toLocaleString('vi-VN')}đ
          </p>
        </div>
      ))}
    </div>
  );
}
