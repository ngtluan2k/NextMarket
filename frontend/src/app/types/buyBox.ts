export type LightProduct = {
  id?: number;
  name?: string;
  store?: {
    name?: string;
    logo_url?: string;
    slug?: string;
  };
  rating?: number;
  reviewsCount?: number;
  listPrice?: number;
  price?: number;
  media?: { url: string; is_primary?: boolean }[];
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
  }>;
  subtotal?: number | string;
};
