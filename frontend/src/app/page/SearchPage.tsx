// src/pages/SearchPage.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Product } from "../../service/product.service";
import EveryMartHeader from "../components/Navbar";
import Breadcrumb from "../components/Breadcrumb";
import { useSearchBreadcrumbs } from "../hooks/useSearchBreadcrumbs";
import { vnd } from "../components/productDetail/BuyBox";

// --- ProductCard riêng cho SearchPage ---
const SearchProductCard: React.FC<{ product: Product; onClick: () => void }> = ({ product, onClick }) => {
  const imageUrl =
    product.media?.find((m) => m.is_primary)?.url ||
    product.media?.[0]?.url ||
    "https://via.placeholder.com/220x220?text=No+Image";

  const brandName = product.brand?.name ?? "Không có thương hiệu";

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
        <p className="mt-1 text-sm font-semibold">{vnd(product.base_price as number)}</p>
      )}
    </div>
  );
};

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const crumbs = useSearchBreadcrumbs();

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
          throw new Error(json.message || "Lỗi server");
        }
        const json = await res.json();
        if (!json.data || !Array.isArray(json.data)) throw new Error("Dữ liệu trả về không hợp lệ");
        setProducts(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query]);

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

          {loading && <div>Đang tìm...</div>}
          {error && <div className="text-red-500">{error}</div>}
          {!loading && !error && products.length === 0 && <div>Không tìm thấy sản phẩm</div>}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {products.map((p) => (
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
