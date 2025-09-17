import { useEffect, useState } from "react";
<<<<<<< HEAD
import { Product, CardItem } from "../components/productDetail/product";
import { getProduct, getCombos } from "../../service/product.service";

=======
import { getProduct, getCombos } from "../../service/product.service";
import type { Product, CardItem } from "../components/productDetail/product";
>>>>>>> 45287316b3ee477283821a21b168cc772f49f523
const adaptProduct = (raw: any): Product => ({
  id: raw?.id,
  name: raw?.title ?? raw?.name,
  author: raw?.author_name ?? raw?.author,
  images: raw?.images ?? [],
<<<<<<< HEAD
  price: raw?.price?.current ?? raw?.price,
=======
  price: Number(raw?.variants?.[0]?.price ?? raw?.base_price ?? 0),
>>>>>>> 45287316b3ee477283821a21b168cc772f49f523
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

<<<<<<< HEAD
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
=======

export function useProductDetail(slug: string) {
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [combos, setCombos] = useState<any[]>([]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    fetch(`http://localhost:3000/products/slug/${slug}`)
      .then(res => res.json())
      .then(json => {
        setProduct(json.data);
        // nếu có combos, giả sử api trả về luôn hoặc lọc trong json.data
        setCombos(json.data.combos ?? []);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return { loading, product, combos };
}

>>>>>>> 45287316b3ee477283821a21b168cc772f49f523
