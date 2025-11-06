import axios from 'axios';
import {API_BASE_URL} from  "../../app/api/api";

export interface DashboardStats {
  totalRevenue: string;
  totalPending: string;
  totalPaid: string;
  totalLinks: number;
  totalBuyers: number;
}

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found!');
  }
  return { Authorization: `Bearer ${token}` };
};

const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    console.error('API error:', error.response?.status, error.response?.data);
  } else {
    console.error('Unexpected error:', error);
  }
  throw error;
};

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const res = await axios.get(`${API_BASE_URL}/affiliate-links/dashboard-stats`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export interface CommissionHistoryItem {
  id: string;
  amount: number;
  rate_percent: number;
  status: 'PENDING' | 'PAID';
  level: number;
  created_at: string;
  product: {
    id: number;
    name: string;
    image?: string;
  };
  order: {
    id: number;
    order_number: string;
    total_amount: number;
    created_at: string;
  };
  affiliate_link: {
    id: number;
    code: string;
  };
}

export interface CommissionHistory {
  commissions: CommissionHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getCommissionHistory(page: number = 1, limit: number = 20): Promise<CommissionHistory> {
  try {
    const res = await axios.get(`${API_BASE_URL}/affiliate-links/commission-history`, {
      params: { page, limit },
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export interface CommissionSummaryPeriod {
  period: string;
  totalEarned: number;
  totalPending: number;
  totalPaid: number;
  totalCommissions: number;
  totalOrders: number;
}

export async function getCommissionSummary(
  period: 'daily' | 'weekly' | 'monthly' = 'monthly',
  limit: number = 12
): Promise<CommissionSummaryPeriod[]> {
  try {
    const res = await axios.get(`${API_BASE_URL}/affiliate-links/commission-summary`, {
      params: { period, limit },
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export interface BalanceInfo {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
}

export async function getBalance(): Promise<BalanceInfo> {
  try {
    const res = await axios.get(`${API_BASE_URL}/affiliate-links/balance`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export interface ProductSearchResult {
  id: number;
  name: string;
  description: string;
  base_price: number;
  image?: string;
  media: Array<{
    id: number;
    url: string;
    media_type: string;
    is_primary: boolean;
    sort_order?: number;
  }>;
  store: {
    id: number;
    name: string;
  };
  brand: {
    id: number;
    name: string;
  };
  categories: Array<{
    id: number;
    name: string;
  }>;
  variants: Array<{
    id: number;
    name: string;
    sku: string;
    price: number;
    stock: number;
  }>;
}

export interface ProductSearchResponse {
  products: ProductSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function searchProducts(
  search: string,
  page: number = 1,
  limit: number = 20
): Promise<ProductSearchResponse> {
  try {
    const res = await axios.get(`${API_BASE_URL}/affiliate-links/search-products`, {
      params: { search, page, limit },
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

