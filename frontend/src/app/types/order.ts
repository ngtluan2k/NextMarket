export interface ProductItem {
  id: number;
  quantity: number;
  subtotal: string;
  product: {
    id: number;
    name: string;
    base_price: string;
    brand_id: number;
    description: string;
    short_description: string;
    slug: string;
    status: string;
    store_id: number;
    updated_at: string;
    created_at: string;
    uuid: string;
  };
  variant?: {
    id: number;
    sku: string;
    price: string;
    stock: number;
    variant_name: string;
    barcode: string;
    created_at?: string;
    updated_at?: string;
    uuid: string;
  };
  discount: string;
  price: string;
  uuid: string;
}

export interface GroupOrder {
  id: number;
  uuid: string;
  name: string;
  status: 'open' | 'locked' | 'completed' | 'cancelled';
  delivery_mode: 'host_address' | 'member_address';
  expires_at: string | null;
  created_at: string;
  discount_percent?: number;
  user?: {
    id: number;
    username: string;
    email: string;
    profile?: UserProfile;
  };
}

export interface UserProfile {
  id: number;
  user_id: number;
  full_name?: string;
  phone?: string;
  avatar?: string;
  date_of_birth?: string;
  gender?: string;
  bio?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Payment {
  id: number;
  amount: string;
  createdAt: string;
  paidAt?: string | null;
  provider?: string | null;
  rawPayload?: string | null;
  status: string;
  transactionId?: string | null;
  uuid: string;
}

export interface Sale {
  id: number;
  orderNumber: string;
  orderItem: ProductItem[];
  totalAmount: string;
  subtotal: string;
  discountTotal: string;
  shippingFee: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  currency: string;
  user: {
    id: number;
    username: string;
    email: string;
    password: string;
    status: string;
    code: string | null;
    uuid: string;
    created_at: string;
    updated_at?: string | null;
    profile?: UserProfile;
  };
  userAddress?: {
    id: number;
    recipientName: string;
    phone: string;
    country: string;
    province: string;
    district: string | null;
    ward: string;
    street: string;
    postalCode: string | null;
    isDefault: boolean;
    createdAt?: string | null;
    uuid: string;
    user_id: number;
  };
  payment?: Payment[];
  paymentMethod?: string;
  notes?: string;
  group_order?: GroupOrder | null;
  group_order_id?: number | null;
}
