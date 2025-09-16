import React, { useEffect, useState } from "react";
import ProductCard, { Product } from "./ProductCard";

type ProductRaw = {
  id: number;
  name: string;
  media?: { url: string; is_primary?: boolean }[];
  base_price?: string;
  variants?: { price: string }[];
  brand?: { name: string };
};

type Props = {
  products?: Product[]; // nếu có thì hiển thị luôn, không fetch
  title?: string;
  slug?: string; // ✅ thêm slug để lọc theo category
};

const ProductList: React.FC<Props> = ({ products: initialProducts, title, slug }) => {
  const [products, setProducts] = useState<Product[]>(initialProducts || []);
  const [loading, setLoading] = useState(!initialProducts);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProducts) return; // có props rồi thì bỏ qua fetch

    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");

        // ✅ Nếu có slug thì query theo category
let url = `http://localhost:3000/categories/${slug}/products`;
        if (slug) url += `?category=${slug}`;

const res = await fetch(url, {
  headers: { Authorization: `Bearer ${token}` },
});

if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
const json = await res.json(); // nhận object
const rawProducts: ProductRaw[] = json.data || []; // lấy field data

const mapped: Product[] = rawProducts.map((p) => {
  const primaryMedia = p.media?.find((m) => m.is_primary) || p.media?.[0];
  const mainVariant = p.variants?.[0];
  return {
    id: p.id,
    name: p.name,
    image: primaryMedia?.url || "https://via.placeholder.com/220x220?text=No+Image",
    price: Number(mainVariant?.price || p.base_price || 0),
    brandName: p.brand?.name,
  };
});

if (!cancelled) setProducts(mapped);

      } catch (e: any) {
        if (!cancelled) setError(e.message || "Không tải được sản phẩm");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, [initialProducts, slug]); // ✅ refetch khi slug đổi

  if (loading) return <div>Đang tải sản phẩm…</div>;
  if (error) return <div className="text-red-500">Lỗi: {error}</div>;
  if (products.length === 0) return <div>Chưa có sản phẩm.</div>;

  return (
    <div>
      {title && <h2 className="mb-3 text-lg font-bold">{title}</h2>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
};

export default ProductList;
