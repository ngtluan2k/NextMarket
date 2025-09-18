import axios from 'axios';
import { getCurrentUserId } from './auth.helper';

const API_BASE_URL = 'http://localhost:3000'; // Adjust based on your backend URL

export interface Store {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  description?: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  // Add other fields as needed
}

class StoreService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token'); // Adjust based on how you store the token
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  async getMyStore(): Promise<Store | null> {
  const response = await axios.get(`${API_BASE_URL}/stores/my-store`, {
    headers: this.getAuthHeaders(),
  });
  return response.data.data; // object
}



}

export const storeService = new StoreService();
