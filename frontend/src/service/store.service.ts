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

  async getMyStores(): Promise<Store[]> {
    const userId = getCurrentUserId();
    console.log('userid: ' + userId);
    const response = await axios.get(`${API_BASE_URL}/stores/owner/${userId}`, {
      headers: this.getAuthHeaders(),
    });
    return response.data.data;
  }
}

export const storeService = new StoreService();
