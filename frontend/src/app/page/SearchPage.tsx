// src/pages/SearchPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Product } from '../../service/product.service';
import EveryMartHeader from '../components/Navbar';
import Breadcrumb from '../components/Breadcrumb';
import { useSearchBreadcrumbs } from '../hooks/useSearchBreadcrumbs';
import { Rate } from 'antd';
import ExploreBrands from '../components/ExploreBrands';
import ExploreCategories from '../components/ExploreCategories';
// import { vnd } from '../components/productDetail/BuyBox';

// --- ProductCard riêng cho SearchPage ---
const SearchProductCard: React.FC<{
  product: Product;
  onClick: () => void;
}> = ({ product, onClick }) => {
  const toImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url; // đã là full URL thì giữ nguyên
    return `http://localhost:3000${url}`; // thêm host nếu là path uploads
  };

  const imageUrl =
    toImageUrl(product.media?.find((m) => m.is_primary)?.url) ||
    toImageUrl(product.media?.[0]?.url) ||
    '';

  const brandName = product.brand?.name ?? 'Không có thương hiệu';

  return (
    <div
      className="cursor-pointer rounded-xl border border-slate-200 bg-white p-2 hover:shadow-md transition-shadow overflow-hidden"
      onClick={onClick}
    >
      <img
        src={imageUrl}
        alt={product.name}
        className="w-full aspect-square object-cover rounded-lg"
      />

      <h3 className="mt-2 text-sm font-bold line-clamp-2">{product.name}</h3>
      <p className="text-xs text-slate-500">{brandName}</p>
      {product.base_price != null && (
        <p className="mt-1 text-sm font-semibold">
          {/* {vnd(product.base_price as number)} */}
        </p>
      )}
      <div className="mt-1 flex items-center gap-1">
        <Rate
          disabled
          allowHalf
          value={Number(product.avg_rating) || 0} // ép về number
          style={{ fontSize: 14 }}
        />
        <span className="text-xs text-slate-500">
          ({(Number(product.avg_rating) || 0).toFixed(1)})
        </span>
      </div>
    </div>
  );
};

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const crumbs = useSearchBreadcrumbs();

  // Selected filters
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  // Fetch products
  useEffect(() => {
    if (!query) return;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `http://localhost:3000/products/search?q=${encodeURIComponent(query)}`
        );
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.message || 'Lỗi server');
        }
        const json = await res.json();
        if (!json.data || !Array.isArray(json.data))
          throw new Error('Dữ liệu trả về không hợp lệ');
        setProducts(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query]);

  // Build unique brands & categories
  const allBrands = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    products.forEach((p) => {
      if (p.brand) map.set(p.brand.id, { id: p.brand.id, name: p.brand.name });
    });
    return Array.from(map.values());
  }, [products]);

  const allCategories = useMemo(() => {
    const map = new Map<number, { id: number; name: string }>();
    products.forEach((p) =>
      p.categories?.forEach((c) => {
        const cat = c.category;
        if (cat) map.set(cat.id, { id: cat.id, name: cat.name });
      })
    );
    return Array.from(map.values());
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchBrand =
        selectedBrandIds.length === 0 ||
        (p.brand && selectedBrandIds.includes(p.brand.id));
      const matchCategory =
        selectedCategoryIds.length === 0 ||
        p.categories?.some(
          (c) => c.category && selectedCategoryIds.includes(c.category.id)
        );
      return matchBrand && matchCategory;
    });
  }, [products, selectedBrandIds, selectedCategoryIds]);

  if (!query) return <div className="p-5">Nhập từ khóa tìm kiếm...</div>;

  return (
    <>
      <EveryMartHeader />
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <main className="flex-1 mx-auto w-full max-w-screen-2xl px-4 py-6">
          <Breadcrumb items={crumbs} />
          <h2 className="text-lg font-semibold mb-4">
            Kết quả tìm kiếm cho: "{query}"
          </h2>

          {/* Filters */}
          <div className="flex gap-4 mb-4 flex-wrap">
            <ExploreBrands
              title="Thương hiệu"
              fetchItems={async () => allBrands}
              selectedIds={selectedBrandIds}
              onSelect={(b) =>
                setSelectedBrandIds((prev) =>
                  prev.includes(Number(b.id))
                    ? prev.filter((id) => id !== Number(b.id))
                    : [...prev, Number(b.id)]
                )
              }
            />
            <ExploreCategories
              title="Danh mục"
              fetchItems={async () => allCategories}
              selectedIds={selectedCategoryIds}
              onSelect={(c) =>
                setSelectedCategoryIds((prev) =>
                  prev.includes(Number(c.id))
                    ? prev.filter((id) => id !== Number(c.id))
                    : [...prev, Number(c.id)]
                )
              }
            />
          </div>

          {/* Products */}
          {loading && <div>Đang tìm...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {!loading && !error && filteredProducts.length === 0 && (
            <div>Không tìm thấy sản phẩm</div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredProducts.map((p) => (
              <SearchProductCard
                key={p.id}
                product={p}
                onClick={() => navigate(`/products/slug/${p.slug}`)}
              />
            ))}
          </div>
        </main>
      </div>
    </>
  );
}
