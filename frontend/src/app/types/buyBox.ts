export type LightProduct = {
  id?: number;
  name?: string;
  store?: {
    id?:number;
    name?: string;
    logo_url?: string;
    slug?: string;
  };
  rating?: number;
  reviewsCount?: number;
  listPrice?: number;
  price?: number;
  media?: { url: string; is_primary?: boolean }[];
  selectedPricingRule?: { id: number; type: 'bulk' | 'subscription' | 'normal' | 'flash_sale' } | null;
};

export type CheckoutLocationState = {
  items?: Array<{
    id: number;
    product_id: number;
    price: number | string;
    quantity: number;
    product: LightProduct;
    variant?: {
      id?: number;
      variant_name?: string;
      price?: number;
      stock?: number;
    };
    type?: 'bulk' | 'subscription' | 'normal' | 'flash_sale';
    pricing_rule?: { id: number } | undefined;

  }>;
  subtotal?: number | string;
  
};
