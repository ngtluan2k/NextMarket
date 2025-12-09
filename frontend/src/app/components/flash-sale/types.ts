// components/flash-sale/types.ts

export interface FlashSaleScheduleApi {
  id: number;
  name: string;
  starts_at: string;
  ends_at: string;
  description?: string;
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

export interface FlashSaleSchedule {
  id: number;
  name: string;
  startsAt: Date;
  endsAt: Date;
  description?: string;
  status: string;
}


export interface FlashSaleApiProduct {
  id: number;

  // tên
  name?: string;
  product_name?: string;

  // media
  image?: string;
  media?: Array<{ url: string; is_primary?: boolean }>;

  // rating
  rating?: number | string;
  avg_rating?: number | string;
  review_count?: number | string;
  reviews?: number | string;

  // giá
  price?: number | string;
  base_price?: number | string;
  flash_sale_price?: number | string;
  original_price?: number | string;
  salePrice?: number | string;
  originalPrice?: number | string;
  discount?: number | string;

  // số lượng
  limit_quantity?: number;
  remaining_quantity?: number;
  stock?: number;

  // thương hiệu
  brand?: { name: string } | string;

  // variants, pricing rules
  variants?: Array<{ price: number | string; stock?: number }>;
  pricing_rules?: Array<{ price: number | string }>;

  // badge
  badge?: string;

  // store (không có trong mapping hiện tại nhưng vẫn giữ)
  store?: { id: number; name: string };
}


export interface FlashSaleProduct {
  id: number;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  originalPrice: number;
  salePrice: number;
  discount: number;
  badge: string;
  remaining_quantity: number;
  limit_quantity: number;
}

export interface FlashSaleTimeSlot {
  time: string;
  label: string;
  isHighlighted: boolean;
}
