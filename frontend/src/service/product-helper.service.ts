import axios from 'axios';
import { Product } from './product.service';
import { BE_BASE_URL } from '../app/api/api';

export interface ProductOption {
  id: number;
  name: string;
  variants?: VariantOption[];
}

export interface VariantOption {
  id: number;
  variant_name: string;
  sku: string;
}

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found!');
  }
  return { Authorization: `Bearer ${token}` };
};

export async function getAllProducts(): Promise<ProductOption[]> {
  try {
    const res = await axios.get<Product[]>(`${BE_BASE_URL}/products`, {
      headers: getAuthHeaders(),
    });
    
    // Transform products to include variants
    const products: ProductOption[] = res.data
      .filter(product => product.status === 'active')
      .map(product => ({
        id: product.id,
        name: product.name,
        variants: product.variants?.map(v => ({
          id: v.id,
          variant_name: v.variant_name || `Variant ${v.id}`,
          sku: v.sku,
        })) || [],
      }));
    
    return products;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
}

