// src/components/productDetail/product.ts
export type Variant = {
  id: number;
  variant_name?: string;
  price?: number | string; // API có thể trả string, convert khi dùng
  sku?: string;
  stock?: number;
  // thêm field tùy bạn (attributes, options, ...)
};

export type Product = {
  id?: number;
  name?: string;
  slug?: string;
  author?: string;
  images?: string[];
  base_price?: number | string;
  variants?: Variant[];
  price?: number;
  listPrice?: number;
  rating?: number;
  reviewsCount?: number;
  sellerName?: string;
  pricing_rules?: Array<{
    min_quantity: number;
    price: number | string;
    starts_at?: string;
    ends_at?: string;
  }>;
  store?: { id?: number; name?: string; slug?: string; logo_url?: string }; // ✅ thêm store ở đây
  media?: { url: string; is_primary?: boolean }[];
};

// export type CardItem = {
//   id?: string;

//   sellerName?: string;
//   pricing_rules?: Array<{
//     min_quantity: number;
//     price: number | string;
//     starts_at?: string;
//     ends_at?: string;
//   }>;
//   store?: { id?: number; name?: string }; // ✅ thêm store ở đây
// };

export type CardItem = {
  id?: number;
  name?: string;
  image?: string;
  price?: number;
  listPrice?: number;
  rating?: number;
  variantId?: number;
};
