import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../service/product.service'; // import từ service

type Props = {
  brandIds: number[];
  categoryIds?: number[];
  title?: string;
};

const ProductListByBrand: React.FC<Props> = ({
  brandIds,
  categoryIds,
  title,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const allProducts: Product[] = [];

        for (const id of brandIds) {
          const res = await fetch(
            `http://localhost:3000/brands/${id}/products`
          );
          const json = await res.json();
          allProducts.push(...(json.data || []));
        }

        // Lọc theo categoryIds nếu có
        const filtered =
          categoryIds && categoryIds.length > 0
            ? allProducts.filter((p) =>
                p.categories?.some(
                  (c) => c.category && categoryIds.includes(c.category.id)
                )
              )
            : allProducts;

        setProducts(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (brandIds.length) fetchProducts();
  }, [brandIds, categoryIds]);

  if (loading) return <div>Đang tải sản phẩm…</div>;
  if (!products.length) return <div>Chưa có sản phẩm nào.</div>;

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4`}
    >
      {title && <h3 className="col-span-full text-lg font-bold">{title}</h3>}

      {products.map((p) => {
        const primaryMedia = p.media?.find((m) => m.is_primary);

        const imageUrl = primaryMedia?.url
          ? primaryMedia.url.startsWith('http')
            ? primaryMedia.url // đã là URL web
            : `http://localhost:3000/${primaryMedia.url.replace(/^\/+/, '')}` // đường dẫn local
          : 'https://via.placeholder.com/220x220?text=No+Image';

        return (
          <div
            key={p.id}
            className="rounded-xl border border-slate-200 bg-white p-2 hover:shadow-md transition-shadow"
          >
            <div
              className="cursor-pointer"
              onClick={() => navigate(`/products/slug/${p.slug}`)}
            >
              <div className="relative w-full aspect-square overflow-hidden rounded-lg">
                <img
                  src={imageUrl}
                  alt={p.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://via.placeholder.com/220x220?text=No+Image';
                  }}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <h3 className="mt-2 text-sm font-bold line-clamp-2">{p.name}</h3>
              {p.brand?.name && (
                <p className="text-xs text-slate-500">{p.brand.name}</p>
              )}
              {p.base_price != null && (
                <p className="mt-1 text-sm font-semibold">
                  {Number(p.base_price).toLocaleString('vi-VN')}₫
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductListByBrand;
