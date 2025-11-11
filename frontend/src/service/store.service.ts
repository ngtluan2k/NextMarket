import axios from 'axios';
import { getCurrentUserId } from './auth.helper';

const API_BASE_URL = import.meta.env.VITE_BE_BASE_URL;; // Adjust based on your backend URL
export interface StoreLevel {
  id: number;
  store_id: number;
  level: 'basic' | 'trusted' | 'premium';
  upgraded_at: string; // hoặc Date nếu parse
}

export interface Store {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  storeLevels?: StoreLevel[];
  // Add other fields as needed
}

export type RegisterSellerPayload = {
  store_id: number;
  store_information?: {
    type?: string;
    name?: string;
    tax_code?: string;
    addresses?: string;
  };
  store_information_email?: { email: string };
  store_identification?: {
    type?: string;
    full_name?: string;
    img_front?: string;
    img_back?: string;
  };
  store_address?: {
    recipient_name?: string;
    phone?: string;
    street?: string;
    ward?: string;
    district?: string;
    province?: string;
    country?: string;
    postal_code?: string;
    type?: string;
    detail?: string;
  };
  bank_account?: {
    bank_name?: string;
    account_holder?: string;
    account_number?: string;
  };
};

export class StoreService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token'); // Adjust based on how you store the token
    return {
      Authorization: `Bearer ${token}`,
    };
  }
  async getStores(includeDeleted = false) {
    const res = await axios.get(`${API_BASE_URL}/stores`, {
      headers: this.getAuthHeaders(),
      params: { includeDeleted },
    });
    return res.data.data;
  }

  async getMyStore(): Promise<Store | null> {
    const response = await axios.get(`${API_BASE_URL}/stores/my-store`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data; // object
  }

  async getFullStore(id: number) {
    const res = await axios.get(`${API_BASE_URL}/stores/${id}/full`, {
      headers: this.getAuthHeaders(),
    });
    return res.data.data; // { store, storeInformation, storeIdentification, ... }
  }

  async restoreStore(id: number) {
    const res = await axios.put(`${API_BASE_URL}/stores/${id}/restore`, null, {
      headers: this.getAuthHeaders(),
    });
    return res.data;
  }

  async updateStore(id: number, dto: Partial<Store>) {
    const res = await axios.put(`${API_BASE_URL}/stores/${id}`, dto, {
      headers: this.getAuthHeaders(),
    });
    return res.data?.data;
  }

  async updateComprehensive(payload: RegisterSellerPayload) {
    const res = await axios.post(
      `${API_BASE_URL}/stores/register-seller`,
      payload,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return res.data?.data;
  }

  async followStore(id: number) {
    const res = await axios.post(
      `${API_BASE_URL}/store-followers/${id}/follow`,
      null,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return res.data.data; // { followed: true }
  }

  async unfollowStore(id: number) {
    const res = await axios.delete(
      `${API_BASE_URL}/store-followers/${id}/follow`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return res.data.data; // { followed: false }
  }

  async toggleFollow(id: number) {
    const res = await axios.post(
      `${API_BASE_URL}/store-followers/${id}/toggle`,
      null,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return res.data.data; // { followed: boolean }
  }

  async isFollowing(id: number) {
    const res = await axios.get(
      `${API_BASE_URL}/store-followers/${id}/is-following`,
      {
        headers: this.getAuthHeaders(),
      }
    );
    return res.data.data; // { followed: boolean }
  }

  async followersCount(id: number) {
    const res = await axios.get(`${API_BASE_URL}/store-followers/${id}/count`);
    return res.data.data; // { count: number }
  }
}

export const storeService = new StoreService();
