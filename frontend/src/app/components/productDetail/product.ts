export type StoreInfo = {
  id?: number;
  name?: string;
  logo_url?: string;
  user_id?: number;
  slug?: string;
};

export type BrandInfo = {
  id?: number;
  name?: string;
  logo_url?: string;
};

export type MediaInfo = {
  id?: number;
  url: string;
  is_primary?: boolean;
};

export type VariantInfo = {
  id?: number;
  sku?: string;
  name?: string;
  price?: number;
  stock?: number;
};

export type PricingRuleInfo = {
  id?: number;
  type?: string;
  min_quantity?: number;
  price?: number;
  cycle?: string;
  starts_at?: string;
  ends_at?: string;
};

export type Product = {
  id?: number;
  uuid?: string;
  name?: string;
  slug?: string;
  short_description?: string;
  description?: string;
  base_price?: number;
  status?: string;
  store?: StoreInfo;
  brand?: BrandInfo;
  media?: MediaInfo[];
  variants?: VariantInfo[];
  pricing_rules?: PricingRuleInfo[];
  price?: number;
  listPrice?: number;
  rating?: number;
  reviewsCount?: number;
  sellerName?: string;
};

export type CardItem = {
  id?: number;
  name?: string;
  image?: string;
  price?: number;
  listPrice?: number;
  rating?: number;
  variantId?: number;
};
