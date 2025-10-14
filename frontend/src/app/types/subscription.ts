// types/subscription.ts
export interface Subscription {
  id: number;
  uuid: string;
  name: string;
  price: string;
  cycle: string;
  totalQuantity: number;
  remainingQuantity: number;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: number;
    uuid: string;
    store_id: number;
    brand_id: number;
    name: string;
    slug: string;
    short_description: string;
    description: string;
    base_price: string;
    status: string;
    created_at: string;
    updated_at: string;
    avg_rating: string;
    review_count: number;
    store: {
      id: number;
      uuid: string;
      user_id: number;
      name: string;
      slug: string;
      description: string;
      logo_url: string;
      email: string;
      phone: string;
      status: string;
      is_draft: boolean;
      is_deleted: boolean;
      deleted_at: string | null;
      created_at: string;
      updated_at: string;
      avg_rating: string;
      review_count: number;
    };
    media: {
      id: number;
      uuid: string;
      media_type: string;
      url: string;
      is_primary: boolean;
      sort_order: number;
    }[];
  };
  variant: {
    id: number;
    uuid: string;
    product_id: number;
    sku: string;
    variant_name: string;
    price: string;
    stock: number;
    barcode: string;
    created_at: string | null;
    updated_at: string | null;
  };
  user: {
    id: number;
    uuid: string;
    username: string;
    email: string;
    password: string;
    status: string;
    code: string | null;
    created_at: string;
    updated_at: string | null;
    is_affiliate: boolean | null;
    profile: {
      id: number;
      uuid: string;
      user_id: number;
      full_name: string;
      dob: string;
      phone: string;
      gender: string;
      avatar_url: string;
      country: string;
      created_at: string;
    };
  };
}


export interface UseSubscriptionBody {
  subscriptionId: number;
  usedQuantity?: number;
  addressId: number;
  note?: string;
}

export interface UseSubscriptionResponse {
  message: string;
  orderUuid: string;
  remaining: number;
}
