import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

export interface Product {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  short_description?: string;
  description?: string;
  base_price?: number | string; 
  status: string;
  created_at: string;
  updated_at: string;
  store_id?: number;
  brand_id?: number;
  store?: {
    id: number;
    uuid: string;
    user_id: number;
    name: string;
    slug: string;
    description?: string;
    email?: string | null;
    phone?: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  };
  brand?: {
    id: number;
    uuid: string;
    name: string;
    description?: string;
    logo_url?: string | null;
    created_at: string;
  };
  categories?: Array<{
    id: number;
    uuid: string;
    product_id: number;
    category_id: number | null;
    created_at: string;
    updated_at: string;
    category?: {
      id: number;
      uuid: string;
      parent_id: number | null;
      name: string;
      slug: string;
      description?: string;
      created_at: string;
    };
  }>;
  media?: Array<{
    id: number;
    uuid: string;
    media_type: string;
    url: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  variants?: Array<{
    id: number;
    uuid: string;
    product_id: number;
    sku: string;
    variant_name: string;
    price: string | number;
    stock: number;
    barcode: string;
    created_at: string;
    updated_at: string;
  }>;
  pricing_rules?: Array<{
    id: number;
    uuid: string;
    type: string;
    min_quantity: number;
    price: string | number;
    cycle: string;
    starts_at: string;
    ends_at: string;
  }>;
}

export interface CreateProductDto {
  name: string;
  short_description?: string;
  description?: string;
  base_price?: number;
  brandId: number;
  categories?: number[];
  media?: Array<{
    media_type: string;
    url: string;
    is_primary?: boolean;
    sort_order?: number;
  }>;
  variants?: Array<{
    sku: string;
    variant_name: string;
    price: number;
    stock: number;
    barcode?: string;
  }>;
  inventory?: Array<{
    variant_sku: string;
    location: string;
    quantity: number;
    used_quantity?: number;
  }>;
  pricing_rules?: Array<{
    type: string;
    min_quantity: number;
    price: number;
    cycle?: string;
    starts_at?: string;
    ends_at?: string;
  }>;
}


export type UpdateProductDto = Partial<CreateProductDto>;

class ProductService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token'); // Adjust based on how you store the token
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async getStoreProducts(storeId: number): Promise<Product[]> {
    console.log('store id inside service: ' + storeId);
    const response = await axios.get(
      `${API_BASE_URL}/products/store/${storeId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data.data;
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const response = await axios.post(`${API_BASE_URL}/products`, dto, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async updateProduct(id: number, dto: UpdateProductDto): Promise<Product> {
    const response = await axios.put(`${API_BASE_URL}/products/${id}`, dto, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

async softDeleteProduct(id: number): Promise<void> {
  await axios.delete(`${API_BASE_URL}/products/${id}`, {
    headers: this.getAuthHeaders(),
  });
}
}

export const productService = new ProductService();
