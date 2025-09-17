import { useEffect, useState } from "react";
import { Product, CardItem } from "../components/productDetail/product";
import { getProduct, getCombos } from "../../service/product.service";

const adaptProduct = (raw: any): Product => ({
  id: raw?.id,
  name: raw?.title ?? raw?.name,
  author: raw?.author_name ?? raw?.author,
  images: raw?.images ?? [],
  price: raw?.price?.current ?? raw?.price,
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

export function useProductDetail(id = "") {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product>();
  const [combos, setCombos] = useState<CardItem[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [pRaw, cRaw] = await Promise.all([getProduct(id), getCombos(id)]);
        if (!alive) return;
        setProduct(pRaw ? adaptProduct(pRaw) : {});
        setCombos(Array.isArray(cRaw) ? cRaw.map(adaptCombo) : []);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  return { loading, product, combos };
}
