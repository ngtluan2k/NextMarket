import axios from 'axios';

import { BE_BASE_URL } from '../app/api/api';

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
  avg_rating?: number;
  review_count?:number;
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
    inventories?: Array<{
      id: number;
      uuid: string;
      location: string;
      quantity: number;
      used_quantity?: number;
    }>;
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
    variant_sku?: string;
    name?: string;
    status?: 'active' | 'inactive';
    limit_quantity?:number;
  }>;
}

export interface ProductCardType {
  id: number | string;
  name: string;
  slug?: string;
  media?: Array<{
    url: string;
  }>;
  avg_rating?: number;
  review_count?: number;
  base_price?: number | string;
   pricing_rules?: Array<{
    price: number | bigint;
    type:string;
  }>;
  salePrice?: number | string;
  originalPrice?: number | string;
  discount?: number;
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
    variant_sku?: string; // <-- thêm
    name?: string; // <-- thêm
    status?: 'active' | 'inactive'; 
    limit_quantity?:number;// <-- thêm
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
      `${BE_BASE_URL}/products/store/${storeId}`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return response.data.data;
  }

  async createProduct(dto: CreateProductDto): Promise<Product> {
    const response = await axios.post(`${BE_BASE_URL}/products`, dto, {
      headers: this.getAuthHeaders(),
    });
    return response.data;
  }

  async softDeleteProduct(id: number): Promise<void> {
    await axios.delete(`${BE_BASE_URL}/products/${id}`, {
      headers: this.getAuthHeaders(),
    });
  }

  // ✅ Mới: Cập nhật trạng thái sản phẩm (active / draft)
  async toggleProductStatus(id: number): Promise<Product> {
    const response = await axios.patch(
      `${BE_BASE_URL}/products/${id}/toggle-status`,
      {}, // body rỗng
      { headers: this.getAuthHeaders() }
    );
    return response.data;
  }

  async getSimilarProducts(productId: number): Promise<Product[]> {
    const response = await axios.get(
      `${BE_BASE_URL}/products/${productId}/similar`
    );
    return response.data.data; // Assuming the API returns { message: string, data: Product[] }
  }

  // Cập nhật draft
  // Cập nhật draft
  async updateProduct(id: number, dto: FormData) {
    const res = await axios.put(
      `${BE_BASE_URL}/products/${id}`,
      dto,
      { headers: this.getAuthHeaders() } // KHÔNG thêm Content-Type
    );
    return res.data;
  }

  async updateAndPublishProduct(id: number, dto: FormData) {
    const res = await axios.put(`${BE_BASE_URL}/products/${id}/publish`, dto, {
      headers: this.getAuthHeaders(),
    });
    return res.data;
  }

 async getProductById(id: number): Promise<Product> {
    const response = await axios.get(`${BE_BASE_URL}/products/${id}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }
}

export const productService = new ProductService();
