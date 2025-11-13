// src/types/productTypes.ts
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
    review_count?: number;
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
      limit_quantity?: number;
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
      type: string;
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
      variant_sku?: string;
      name?: string;
      status?: 'active' | 'inactive';
      limit_quantity?: number;
    }>;
  }
  
  export type UpdateProductDto = Partial<CreateProductDto>;