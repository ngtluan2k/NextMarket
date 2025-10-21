// src/types/voucher.ts

// =============================
// ENUMS
// =============================

// Loại voucher
export enum VoucherType {
  SHIPPING = 0,
  PRODUCT = 1,
  STORE = 2,
  CATEGORY = 3,
  PLATFORM = 4,
}

// Kiểu giảm giá
export enum VoucherDiscountType {
  PERCENTAGE = 0,
  FIXED = 1,
  CASH_BACK = 2,
}

// Trạng thái voucher
export enum VoucherStatus {
  DRAFT = 0,
  ACTIVE = 1,
  PAUSED = 2,
  EXPIRED = 3,
  DEPLETED = 4,
}

// Kiểu thu thập voucher
export enum VoucherCollectionType {
  AUTO = 0,
  MANUAL = 1,
  TARGETED = 2,
  EVENT = 3,
}

// =============================
// INTERFACES
// =============================

// Order Item
export interface OrderItem {
  productId: number;
  quantity: number;
  price: number;
}

// User Conditions
export interface UserConditions {
  min_orders?: number;
  vip_level?: string[];
  user_tags?: string[];
}

// Time Restrictions
export interface TimeRestrictions {
  days_of_week?: number[];
  hours?: Array<{ start: string; end: string }>;
}

// Voucher Entity
export interface Voucher {
  id: number;
  uuid: string;
  code: string;
  title: string;
  store_id?: number;
  description?: string;
  type: VoucherType;
  discount_type: VoucherDiscountType;
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount: number;
  start_date: string;
  end_date: string;
  total_usage_limit?: number;
  per_user_limit: number;
  total_used_count: number;
  collection_limit?: number;
  collected_count: number;
  status: VoucherStatus;
  collection_type: VoucherCollectionType;
  priority: number;
  stackable: boolean;
  new_user_only: boolean;
  applicable_store_ids?: number[];
  applicable_category_ids?: number[];
  applicable_product_ids?: number[];
  excluded_product_ids?: number[];
  user_conditions?: UserConditions;
  time_restrictions?: TimeRestrictions;
  image_url?: string;
  theme_color?: string;
  createdAt: string;
  updatedAt: string;
  store?: {
    id: number;
    name: string;
  };
}

// Create Voucher Payload
export interface CreateVoucherPayload {
  code: string;
  title: string;
  description?: string;
  type?: VoucherType;
  store?: number;
  discount_type: VoucherDiscountType;
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount?: number;
  start_date: string;
  end_date: string;
  total_usage_limit?: number;
  per_user_limit: number;
  collection_limit?: number;
  status: VoucherStatus;
  collection_type: VoucherCollectionType;
  priority: number;
  stackable: boolean;
  new_user_only: boolean;
  applicable_store_ids?: number[];
  applicable_category_ids?: number[];
  applicable_product_ids?: number[];
  excluded_product_ids?: number[];
  user_conditions?: UserConditions;
  time_restrictions?: TimeRestrictions;
  image_url?: string;
  theme_color?: string;
}

// Update Voucher Payload (all fields optional except what you want to enforce)
// export interface UpdateVoucherPayload extends Partial<CreateVoucherPayload> {}

// Apply Voucher DTO
export interface ApplyVoucherDto {
  code: string;
  store: number;
  orderItems: OrderItem[];
}

// Validate Voucher DTO
export interface ValidateVoucherDto {
  code: string;
  order_amount: number;
  store_id?: number;
}

// Calculate Discount DTO
export interface CalculateDiscountDto {
  voucherCodes: string[];
  userId: number;
  orderItems: OrderItem[];
  store: number;
  orderAmount: number;
}

// Validate Voucher Response
export interface ValidateVoucherResponse {
  voucher: Voucher;
  discount: number;
}

// Calculate Discount Response
export interface CalculateDiscountResponse {
  discountTotal: number;
  appliedVouchers: Array<{
    code: string;
    discount: number;
    type: VoucherType;
  }>;
  invalidVouchers: Array<{
    code: string;
    error: string;
  }>;
}

// =============================
// HELPER FUNCTIONS
// =============================

// Get voucher type label
export const getVoucherTypeLabel = (type: VoucherType): string => {
  const labels = {
    [VoucherType.SHIPPING]: 'Vận chuyển',
    [VoucherType.PRODUCT]: 'Sản phẩm',
    [VoucherType.STORE]: 'Cửa hàng',
    [VoucherType.CATEGORY]: 'Danh mục',
    [VoucherType.PLATFORM]: 'Nền tảng',
  };
  return labels[type] || 'N/A';
};

// Get voucher status label
export const getVoucherStatusLabel = (status: VoucherStatus): string => {
  const labels = {
    [VoucherStatus.DRAFT]: 'Bản nháp',
    [VoucherStatus.ACTIVE]: 'Đang hoạt động',
    [VoucherStatus.PAUSED]: 'Tạm dừng',
    [VoucherStatus.EXPIRED]: 'Hết hạn',
    [VoucherStatus.DEPLETED]: 'Đã dùng hết',
  };
  return labels[status] || 'N/A';
};

// Get discount type label
export const getDiscountTypeLabel = (type: VoucherDiscountType): string => {
  const labels = {
    [VoucherDiscountType.PERCENTAGE]: 'Phần trăm',
    [VoucherDiscountType.FIXED]: 'Cố định',
    [VoucherDiscountType.CASH_BACK]: 'Hoàn tiền',
  };
  return labels[type] || 'N/A';
};

// Get collection type label
export const getCollectionTypeLabel = (type: VoucherCollectionType): string => {
  const labels = {
    [VoucherCollectionType.AUTO]: 'Tự động',
    [VoucherCollectionType.MANUAL]: 'Thủ công',
    [VoucherCollectionType.TARGETED]: 'Định hướng',
    [VoucherCollectionType.EVENT]: 'Sự kiện',
  };
  return labels[type] || 'N/A';
};

// Format discount value
export const formatDiscountValue = (
  value: number,
  type: VoucherDiscountType
): string => {
  if (type === VoucherDiscountType.PERCENTAGE) {
    return `${value}%`;
  }
  return `${value.toLocaleString('vi-VN')} VND`;
};

// Check if voucher is active
export const isVoucherActive = (voucher: Voucher): boolean => {
  const now = new Date();
  const startDate = new Date(voucher.start_date);
  const endDate = new Date(voucher.end_date);

  return (
    voucher.status === VoucherStatus.ACTIVE &&
    now >= startDate &&
    now <= endDate &&
    (!voucher.total_usage_limit ||
      voucher.total_used_count < voucher.total_usage_limit)
  );
};

// Check if voucher is expired
export const isVoucherExpired = (voucher: Voucher): boolean => {
  const now = new Date();
  const endDate = new Date(voucher.end_date);
  return now > endDate || voucher.status === VoucherStatus.EXPIRED;
};

// Check if voucher is depleted
export const isVoucherDepleted = (voucher: Voucher): boolean => {
  return (
    voucher.status === VoucherStatus.DEPLETED ||
    (!!voucher.total_usage_limit &&
      voucher.total_used_count >= voucher.total_usage_limit)
  );
};
