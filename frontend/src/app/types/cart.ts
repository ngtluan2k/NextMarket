export interface CartItem {
  id: number;
  quantity: number;
  price: number;
  product: {
    id: number;
    name: string;
    basePrice: number; 
    url: string;
    media: { url: string; is_primary?: boolean }
    status: 'draft' | 'deleted' | 'active';
  };
  variant?: {
    id: number;
    variant_name: string;
    price: number;
    stock: number;
  };
}
