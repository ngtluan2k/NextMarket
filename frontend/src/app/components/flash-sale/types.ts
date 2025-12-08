import type { ComponentType } from "react";

export type LucideIcon = ComponentType<{ className?: string }>;

export interface Category {
  id: string;
  name: string;
  /** optional key để map icon ở client, VD: "Smartphone" | "Laptop" ... */
  iconKey?: string | null;
}

export interface Product {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  short_description?: string;
  description?: string;
  base_price?: number | string;
  status: string;
  created_at: string;
  updated_at: string;
  store_id?: number;
  brand_id?: number;
  avg_rating?: number;
  review_count?:number;
  store?: {
    id: number;
    uuid: string;
    user_id: number;
    name: string;
    slug: string;
    description?: string;
    email?: string | null;
    phone?: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  };
  brand?: {
    id: number;
    uuid: string;
    name: string;
    description?: string;
    logo_url?: string | null;
    created_at: string;
  };
  categories?: Array<{
    id: number;
    uuid: string;
    product_id: number;
    category_id: number | null;
    created_at: string;
    updated_at: string;
    category?: {
      id: number;
      uuid: string;
      parent_id: number | null;
      name: string;
      slug: string;
      description?: string;
      created_at: string;
    };
  }>;
  media?: Array<{
    id: number;
    uuid: string;
    media_type: string;
    url: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  variants?: Array<{
    id: number;
    uuid: string;
    product_id: number;
    sku: string;
    variant_name: string;
    price: string | number;
    stock: number;
    barcode: string;
    created_at: string;
    updated_at: string;
    weight?:number;
    inventories?: Array<{
      id: number;
      uuid: string;
      location: string;
      quantity: number;
      used_quantity?: number;
    }>;
  }>;

  pricing_rules?: Array<{
    id: number;
    uuid: string;
    type: string;
    weight?:number;
    min_quantity: number;
    price: string | number;
    cycle: string;
    starts_at: string;
    ends_at: string;
    variant_sku?: string;
    name?: string;
    status?: 'active' | 'inactive';
    limit_quantity?:number;
  }>;
}

export interface FlashSaleMeta {
  endAt: string | number | Date;
  stats?: Array<{ label: string; value: string }>;
}
