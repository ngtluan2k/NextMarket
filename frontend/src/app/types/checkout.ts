import { Product, StoreInfo } from "./product";

export type CheckoutItem = {
  id: number;
  name: string;
  image?: string;
  quantity: number;
  price: number | string;
  oldPrice?: number | string;
  product?: Product;
  store?: StoreInfo
  variant?: { id: number; variant_name: string, price: number };
};

export type ShippingMethodType = 'economy' | 'fast';