// types/subscription.ts
export interface Subscription {
  id: number;
  uuid: string;
  name: string;
  price?: number;
  cycle?: string;
  totalQuantity: number;
  remainingQuantity: number;
  startDate?: string;
  endDate?: string;
  status: string;
  product?: {
    id: number;
    name: string;
    store?: {
      id: number;
      name: string;
      logo_url?: string;
    };
    media?: {
      id: number;
      url: string;
      media_type?: string;
      is_primary?: boolean;
    }[];
  };
  variant?: {
    id: number;
    variant_name: string;
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
