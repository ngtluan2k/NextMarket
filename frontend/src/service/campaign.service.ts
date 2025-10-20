// campaign.service.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/campaigns';

export interface RegisteredProduct {
  id: number;
  name: string;
  base_price?: number;
  variants?: { id: number; variant_name: string; price: number | string }[];
}

export interface CampaignStoreDetail {
  storeId: number;
  status: string;
  products?: RegisteredProduct[]; // <-- đây là quan trọng
}

export interface CampaignStoreItem {
  productId: number;
  variantId?: number;
  promoPrice?: number;
}

export interface CampaignStore {
  id: number;
  uuid: string;
  status: 'pending' | 'approved' | 'rejected';
  registeredAt: string;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  store?: {
    id: number;
    name: string;
  };
}

export interface Campaign {
  id: number;
  uuid: string;
  name: string;
  description: string;
  starts_at: string;
  ends_at: string;
  publish: boolean;
  status: 'draft' | 'pending' | 'active' | 'ended';
  banner_url: string;
  created_at: string;
  created_by: number;
  stores: CampaignStore[];
}

///////////////////////////////////////////////////ADMIN SERVICES/////////////////////////////////////////

export const getAllCampaigns = async () => {
  const token = localStorage.getItem('token'); // JWT admin
  const res = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const createCampaign = async (formData: FormData) => {
  const token = localStorage.getItem('token'); // JWT admin
  const res = await axios.post(API_URL, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const approveStore = async (id: number) => {
  const token = localStorage.getItem('token');
  const res = await axios.patch(
    `${API_URL}/campaign-stores/${id}/approve`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

export const rejectStore = async (id: number, reason: string) => {
  const token = localStorage.getItem('token');
  const res = await axios.patch(
    `${API_URL}/campaign-stores/${id}/reject`,
    { reason },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};

export const getCampaignStoreDetail = async (campaignId: number, storeId: number) => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_URL}/${campaignId}/stores/${storeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

///////////////////////////////////////////////////STORE SERVICES/////////////////////////////////////////

// Lấy campaign pending (store)
export const getPendingCampaigns = async () => {
  const token = localStorage.getItem('token'); // JWT store
  const res = await axios.get(`${API_URL}/campaign-stores/pending`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// Không cần storeId nữa
export const registerStoreForCampaign = async (
  campaignId: number,
  items: CampaignStoreItem[]
) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Chưa đăng nhập');

  const res = await axios.post(
    `${API_URL}/campaign-stores/register/${campaignId}`,
    { items }, // ✅ đúng format backend
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return res.data;
};

export const getCampaignDetailForStore = async (campaignId: number) => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_URL}/campaign-stores/${campaignId}/detail`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};
///////////////////////////////////////////////////USER SERVICES/////////////////////////////////////////

export const getActiveCampaigns = async (): Promise<Campaign[]> => {
  const token = localStorage.getItem('token'); // nếu cần auth
  const res = await axios.get('http://localhost:3000/campaigns/active', {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  return res.data;
};
