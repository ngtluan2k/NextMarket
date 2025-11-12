import { message } from 'antd';
import { api } from '../../config/api';
import {
  AffiliateLink,
  AffiliateProduct,
  CreateAffiliateLinkPayload,
} from '../../app/types/affiliate-links';
import { getAuthHeaders } from './affiliate.service';
import { API_BASE_URL } from '../../app/api/api';

const handleApiError = (error: any) => {
  console.error('API Error:', error);
  throw error;
};
export const createAffiliateLink = async (
  payload: CreateAffiliateLinkPayload
): Promise<AffiliateLink> => {
  try {
    const res = await api.post(`${API_BASE_URL}/affiliate-links/create-link`, payload, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error: any) {
    const status = error.response?.status;
    
    // Handle rate limit specifically
    if (status === 429) {
      message.error('Bạn đã tạo quá nhiều liên kết! Vui lòng thử lại sau 1 phút.', 5);
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    
    handleApiError(error);
    throw error;
  }
};

export const getMyAffiliateLinks = async (): Promise<{
  message: string;
  links: AffiliateLink[];
}> => {
  try {
    const res = await api.get(`${API_BASE_URL}/my-links`, {
      headers: getAuthHeaders(),
    });
    console.log(JSON.stringify(res.data, null, 2));
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};

export const getMyAffiliatedProducts = async (): Promise<
  AffiliateProduct[]
> => {
  try {
    const res = await api.get(`${API_BASE_URL}/affiliated-products`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
