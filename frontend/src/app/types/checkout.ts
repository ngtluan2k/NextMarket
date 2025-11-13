import { Product, StoreInfo } from './product';

export type CheckoutItem = {
  id: number;
  name: string;
  image?: string;
  quantity: number;
  price: number | string;
  oldPrice?: number | string;
  product?: Product;
  store?: StoreInfo;
  variant?: { id: number; variant_name: string; price: number };
  type?: 'bulk' | 'subscription' | 'normal' | 'flash_sale';
  pricing_rule?: { id: number } | undefined;
};

export type ShippingMethodType = 'economy' | 'fast';
