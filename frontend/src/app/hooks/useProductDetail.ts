import { useEffect, useState } from 'react';
import type { Product, CardItem } from '../components/productDetail/product';
const adaptProduct = (raw: any): Product => ({
  id: raw?.id,
  name: raw?.title ?? raw?.name,
  author: raw?.author_name ?? raw?.author,
  images: raw?.images ?? [],
  price: Number(raw?.variants?.[0]?.price ?? raw?.base_price ?? 0),
  listPrice: raw?.price?.list ?? raw?.listPrice,
  rating: raw?.rating?.average ?? raw?.rating,
  reviewsCount: raw?.rating?.count ?? raw?.reviewsCount,
  sellerName: raw?.seller?.name ?? raw?.sellerName,
});

const adaptCombo = (raw: any): CardItem => ({
  id: raw?.id,
  name: raw?.title ?? raw?.name,
  image: raw?.thumbnail ?? raw?.image,
  price: raw?.price,
  listPrice: raw?.listPrice,
  rating: raw?.rating,
});

export function useProductDetail(slug: string) {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product>();
  const [combos, setCombos] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    fetch(`http://localhost:3000/products/slug/${slug}`)
      .then((res) => res.json())
      .then((json) => {
        setProduct(json.data);
        // nếu có combos, giả sử api trả về luôn hoặc lọc trong json.data
        setCombos(json.data.combos ?? []);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return { loading, product, combos };
}
