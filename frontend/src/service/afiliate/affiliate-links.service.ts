import { message } from 'antd';
import axios from 'axios';
import { API_BASE_URL } from '../../app/api/api';
import {
  AffiliatedProduct,
  BalanceInfo,
  CommissionHistory,
  CommissionSummaryPeriod,
  CreateLinkRequest,
  CreateLinkResponse,
  DashboardStats,
  MyLink,
  MyLinksResponse,
  ProductSearchResponse,
  Program,
  ProgramsResponse,
} from '../../app/types/affiliate-links';

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
    const res = await axios.get(
      `${API_BASE_URL}/affiliate-links/dashboard-stats`,
      {
        headers: getAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function getCommissionHistory(
  page = 1,
  limit = 20
): Promise<CommissionHistory> {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/affiliate-links/commission-history`,
      {
        params: { page, limit },
        headers: getAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function getCommissionSummary(
  period: 'daily' | 'weekly' | 'monthly' = 'monthly',
  limit = 12
): Promise<CommissionSummaryPeriod[]> {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/affiliate-links/commission-summary`,
      {
        params: { period, limit },
        headers: getAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
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

export async function searchProducts(
  search: string,
  page = 1,
  limit = 20
): Promise<ProductSearchResponse> {
  try {
    const res = await axios.get(
      `${API_BASE_URL}/affiliate-links/search-products`,
      {
        params: { search, page, limit },
        headers: getAuthHeaders(),
      }
    );
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
}

export async function getMyLinks(): Promise<MyLink[]> {
  try {
    const res = await axios.get<MyLinksResponse>(
      `${API_BASE_URL}/affiliate-links/my-links`,
      { headers: getAuthHeaders() }
    );

    return Array.isArray(res.data?.links) ? res.data.links : [];
  } catch (error: any) {
    const status = error.response?.status || 'unknown';
    throw new Error(`Tải liên kết của tôi thất bại (${status})`);
  }
}

export async function getMyAffiliatedProducts():Promise<AffiliatedProduct[]>{
  try {
    const res = await axios.get(
      `${API_BASE_URL}/affiliate-links/affiliated-products`,
      { headers: getAuthHeaders() }
    );
    return (res.data?.data || res.data?.products || []) as AffiliatedProduct[];
  } catch (error: any) {
    const status = error.message?.status || 'unknow';
    throw new Error(`Tải danh sách sản phẩm thất bại ${status}`);
  }
}


export async function getPrograms(): Promise<Program[]> {
  const tryEndpoints = [
    `${API_BASE_URL}/affiliate-programs`,
  ];
  
  for (const url of tryEndpoints) {
    try {
      const res = await axios.get<ProgramsResponse>(url, {
        headers: getAuthHeaders(), 
      });
      const data = res.data;
      const arr = Array.isArray(data) ? data : data?.data || [];
      
      if (Array.isArray(arr) && arr.length) {
        return arr
          .filter(
            (p: any) =>
              p && typeof p.id === 'number' && typeof p.name === 'string'
          )
          .map((p: any) => ({ id: p.id, name: p.name, status: p.status }));
      }
    } catch (error) {
      console.error('Không thể tải chương trình:', error);
    }
  }
  
  return [];
}


export async function createLink(
  payload: CreateLinkRequest
): Promise<CreateLinkResponse> {
  try {
    const res = await axios.post<CreateLinkResponse>(
      `${API_BASE_URL}/affiliate-links/create-link`,
      payload, 
      { headers: getAuthHeaders() }
    );
    return res.data;
  } catch (error: any) {
    const status = error.response?.status;
    
    // Handle rate limit specifically
    if (status === 429) {
      message.error('Bạn đã tạo quá nhiều liên kết! Vui lòng thử lại sau 1 phút.', 5);
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    
    // Handle other errors
    throw new Error(`Tạo liên kết thất bại (${status || 'unknown'})`);
  }
}


export async function deleteLink( id: number): Promise<any> {
  try {
    const res = await axios.delete(
      `${API_BASE_URL}/affiliate-links/${id}`,
      { headers: getAuthHeaders() }
    );
    return res.data || { success: true };
  } catch (error: any) {
    const status = error.response?.status || 'unknown';
    throw new Error(`Xóa liên kết thất bại (${status})`);
  }
}