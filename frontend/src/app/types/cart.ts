import { StoreInfo } from './product';
import { PricingRule } from '../components/productDetail/Info';
export interface CartItem {
  id: number;
  quantity: number;
  price: number;
  is_group?: boolean;
  product: {
    id: number;
    slug: string;
    name: string;
    basePrice: number;
    url: string;
    media: { url: string; is_primary?: boolean };
    status: 'draft' | 'deleted' | 'active';
    store?: StoreInfo;
  };
  variant?: {
    id: number;
    variant_name: string;
    price: number;
    stock: number;
    media?: { url: string; is_primary?: boolean }[];
  };
  type: 'bulk' | 'subscription' | 'normal' | 'flash_sale';
  pricing_rule?: PricingRule;
}
