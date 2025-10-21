// campaign.service.ts
import axios from 'axios';

const API_URL = 'http://localhost:3000/campaigns';

export interface PublicCampaignImage {
  id: number;
  imageUrl: string;
  position: number;
  linkUrl?: string;
}

export interface PublicCampaignSectionItem {
  id: number;
  itemType: 'product' | 'voucher' | 'image' | 'html';
  itemId?: number;
  extraData?: any;
}

export interface PublicCampaignSection {
  id: number;
  type: string;
  title: string;
  position: number;
  configJson?: any;
  items?: PublicCampaignSectionItem[];
}

export interface PublicCampaignVoucher {
  id: number;
  title: string;
  discount_value: number;
  type: 'system' | 'store';
}

export interface PublicCampaignDetail {
  id: number;
  name: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  images: PublicCampaignImage[];
  sections: PublicCampaignSection[];
  vouchers: PublicCampaignVoucher[];
  stores: PublicCampaignStore[]; // <-- thêm stores
}
export interface CampaignProductVariant {
  id: number;
  name: string;
  base_price?: number | string;
  promo_price?: number | string | null;
  status: 'pending' | 'approved' | 'rejected';
  variant?: {
    id: number;
    variant_name: string;
    price: number | string;
  };
}

export interface PublicCampaignStore {
  id: number;
  name: string;
  status: string;
  products: CampaignProductVariant[];
}

export interface CampaignStoreProducts {
  storeId: number;
  storeName: string;
  products: CampaignProductVariant[];
}

export interface PublishCampaignDto {
  campaignId: number;
  images?: { file: File; position?: number; link_url?: string }[];
  sections?: any[];
  vouchers?: { voucher_id: number; type?: string }[];
}
export interface RegisteredProduct {
  id: number;
  storeName?: string;
  name: string;
  base_price?: number;
  variants?: { id: number; variant_name: string; price: number | string }[];
}

export interface CampaignStoreDetail {
  storeId: number;
  storeName: string;
  name: string;
  description?: string;
  starts_at?: string;
  ends_at?: string;
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

export const getCampaignStoreDetail = async (
  campaignId: number,
  storeId: number
) => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_URL}/${campaignId}/stores/${storeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const publishCampaign = async (dto: PublishCampaignDto) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('Chưa đăng nhập admin');

  const formData = new FormData();

  // Thêm banners (nếu có)
  dto.images?.forEach((img) => {
    formData.append('banners', img.file);
    if (img.position !== undefined)
      formData.append('positions', img.position.toString());
    if (img.link_url) formData.append('linkUrls', img.link_url);
  });

  // Thêm sections, vouchers
  if (dto.sections) formData.append('sections', JSON.stringify(dto.sections));
  if (dto.vouchers) formData.append('vouchers', JSON.stringify(dto.vouchers));

  // Gọi API
  const res = await axios.post(
    `${API_URL}/${dto.campaignId}/publish`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return res.data;
};

export const getCampaignDetail = async (campaignId: number) => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_URL}/${campaignId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// export const getCampaignProducts = async (
//   campaignId: number
// ): Promise<CampaignStoreProducts[]> => {
//   const token = localStorage.getItem('token');
//   if (!token) throw new Error('Chưa đăng nhập admin');

//   const res = await axios.get(`${API_URL}/${campaignId}/products`, {
//     headers: { Authorization: `Bearer ${token}` },
//   });

//   return res.data;
// };

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
  const res = await axios.get(
    `${API_URL}/campaign-stores/${campaignId}/detail`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};
///////////////////////////////////////////////////USER SERVICES/////////////////////////////////////////

export const getActiveCampaigns = async (): Promise<Campaign[]> => {
  const res = await axios.get(`${API_URL}/active`, {});
  return res.data;
};

export const getPublicCampaignDetail = async (
  campaignId: number
): Promise<PublicCampaignDetail> => {
  const res = await axios.get(`${API_URL}/public/${campaignId}`);
  return res.data;
};
