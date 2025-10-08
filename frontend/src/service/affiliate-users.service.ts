import { api } from '../config/api';
import {
  AffiliateLink,
  AffiliateProduct,
  CreateAffiliateLinkPayload,
} from '../app/types/affiliate-links';
import { getAuthHeaders } from './affiliate.service';

const API_BASE_URL = 'http://localhost:3000/affiliate-links';

const handleApiError = (error: any) => {
  console.error('API Error:', error);
  throw error;
};
export const createAffiliateLink = async (
  payload: CreateAffiliateLinkPayload
): Promise<AffiliateLink> => {
  try {
    const res = await api.post(`${API_BASE_URL}/create-link`, payload, {
      headers: getAuthHeaders(),
    });
    return res.data;
  } catch (error) {
    handleApiError(error);
    throw error; 
  }
};

export const getMyAffiliateLinks = async (): Promise<{ message: string; links: AffiliateLink[] }> => {
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

export const getMyAffiliatedProducts = async (): Promise<AffiliateProduct[]> => {
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