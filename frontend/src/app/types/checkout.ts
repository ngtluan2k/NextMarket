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
  pricingRuleId?: number; 
};

export type ShippingMethodType = 'economy' | 'fast';
