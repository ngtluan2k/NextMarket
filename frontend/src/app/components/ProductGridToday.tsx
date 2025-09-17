import React, { useEffect, useState } from 'react';
import ProductCard, { ProductItem } from './products/ProductCard';
import { useCart } from '../context/CartContext';

type ProductRaw = {
  id: number;
  name: string;
  media?: { url: string; is_primary?: boolean }[];
  base_price?: string;
  variants?: { price: string }[];
  brand?: { name: string };
};

// type ProductCardData = {
//   id: number;
//   name: string;
//   image: string;
//   price: string;
//   brandName?: string;
// };

type Props = {
  containerClassName?: string; // class cho grid container
  cardClassName?: string; // class cho từng card
  showMessage?: (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => void;
};

export default function ProductGridToday({
  containerClassName = '',
  cardClassName = '',
  showMessage,
}: Props) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/products', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const data: ProductRaw[] = await res.json(); // giả sử API trả thẳng array

        const mapped: ProductItem[] = data.map((p) => {
          const primaryMedia =
            p.media?.find((m) => m.is_primary) || p.media?.[0];
          const mainVariant = p.variants?.[0];
          const price = Number(mainVariant?.price || p.base_price || '0');
          return {
            id: p.id,
            name: p.name,
            imageUrl:
              primaryMedia?.url ||
              'https://via.placeholder.com/220x220?text=No+Image',
            price: price,
            originalPrice: price, // assuming no discount for now
            rating: 0, // placeholder
            ratingCount: 0, // placeholder
            badges: p.brand?.name ? [p.brand.name] : [],
          };
        });

        if (!cancelled) setProducts(mapped);
      } catch (e: any) {
        if (!cancelled) setError(e.message || 'Không tải được sản phẩm');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddToCart = async (product: ProductItem) => {
    try {
      await addToCart(product.id as number);
      if (showMessage) {
        console.log("ok")
        showMessage('success', `${product.name} đã được thêm vào giỏ hàng`);
      }
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  if (loading) return <div>Đang tải sản phẩm…</div>;
  if (error) return <div className="text-red-500">Lỗi: {error}</div>;
  if (products.length === 0) return <div>Chưa có sản phẩm.</div>;

  return (
    <div
      className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 ${containerClassName}`}
    >
      <h3 className="col-span-full text-lg font-bold">Sản phẩm hôm nay</h3>
      {products.map((p) => (
        // <div
        //   key={p.id}
        //   className={`rounded-xl border border-slate-200 bg-white p-2 hover:shadow-md transition-shadow ${cardClassName}`}
        // >
        //   <img
        //     src={p.image}
        //     alt={p.name}
        //     className="w-full aspect-square object-cover rounded-lg"
        //   />
        //   <h3 className="mt-2 text-sm font-bold line-clamp-2">{p.name}</h3>
        //   {p.brandName && (
        //     <p className="text-xs text-slate-500">{p.brandName}</p>
        //   )}
        //   <p className="mt-1 text-sm font-semibold">
        //     {Number(p.price).toLocaleString('vi-VN')}đ
        //   </p>
        // </div>
        <ProductCard
          key={p.id}
          item={p}
          onAddToCart={handleAddToCart}
          className={cardClassName}
        />
      ))}
    </div>
  );
}
