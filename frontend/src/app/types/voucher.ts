// src/types/voucher.ts

export interface Voucher {
  id: number;
  uuid: string;
  code: string;
  title: string;
  description?: string;
  type: number;
  discount_type: number;
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount: number;
  start_date: string;
  end_date: string;
  total_usage_limit?: number;
  per_user_limit: number;
  total_used_count: number;
  collected_count: number;
  status: number;
  collection_type: number;
  priority: number;
  stackable: boolean;
  new_user_only: boolean;
  image_url?: string;
  theme_color?: string;
  store?: {
    id: number;
    name: string;
  };
}

export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

// 🏷 Enum mô tả loại giảm giá
export enum VoucherDiscountType {
  PERCENTAGE = 0,
  FIXED = 1,
  CASH_BACK = 2,
}

// 🏷 Enum mô tả loại voucher
export enum VoucherType {
  SHIPPING = 0,
  PRODUCT = 1,
  STORE = 2,
  CATEGORY = 3,
  PLATFORM = 4,
}
