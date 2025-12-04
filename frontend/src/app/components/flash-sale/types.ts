// components/flash-sale/types.ts

export interface FlashSaleScheduleApi {
  id: number;
  name: string;
  starts_at: string;
  ends_at: string;
  description?: string;
  status: string;
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
