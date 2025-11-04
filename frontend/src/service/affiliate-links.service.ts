import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

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
  }
}

