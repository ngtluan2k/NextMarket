import { Product } from "./product";

export type CheckoutItem = {
  product_id: number;
  name: string;
  image?: string;
  quantity: number;
  price: number | string;
  oldPrice?: number | string;
  product?: Product;
  variant?: { id: number; variant_name: string, price: number };
};

export type ShippingMethodType = 'economy' | 'fast';