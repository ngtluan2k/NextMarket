import { api, API_ENDPOINTS } from '../app/api/api';
import axios from 'axios';
import { getAffiliateDataForOrder } from '../utils/affiliate-tracking';
import { API_BASE_URL } from '../config/api';

export const orderService = {
  // ========== USER ENDPOINTS ==========

  getOrdersByUser: async (userId: number, params?: any) => {
    try {
      const res = await api.get(`${API_ENDPOINTS.users}/${userId}/orders`, {
        params,
      });
      return res.data;
    } catch (error: any) {
      console.error(
        'Lỗi khi lấy đơn hàng:',
        error.response?.data || error.message
      );
      throw error;
    }
  },

  async getOrderByUser(userId: number) {
    try {
      const res = await axios.get(`${API_BASE_URL}/orders/user/${userId}`);
      return res.data;
    } catch (error: any) {
      console.error(
        'Lỗi khi lấy đơn hàng:',
        error.response?.data || error.message
      );
      throw error;
    }
  },

  getOrderDetail: async (orderId: number) => {
    // Lấy user và token từ localStorage
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      throw new Error('Không tìm thấy thông tin đăng nhập');
    }

    const user = JSON.parse(userData);
    const userId = user.user_id ?? user.id;

    // Gọi API lấy chi tiết đơn hàng
    const res = await api.get(
      `${API_ENDPOINTS.users}/${userId}/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data;
  },

  createOrder: async (userId: number, payload: any) => {
    const affiliateData = getAffiliateDataForOrder();
    
    const orderPayload = {
      ...payload,
      ...affiliateData 
    };

    console.log('🛒 Creating order with affiliate data:', {
      hasAffiliateData: !!affiliateData.affiliateCode,
      fullAffiliateData: affiliateData,
    });
    
    // console.log('🔍 DEBUG - Complete order payload:', orderPayload);

    const token = localStorage.getItem('token');
    const res = await api.post(
      `${API_ENDPOINTS.users}/${userId}/orders`,
      orderPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return res.data;
  },

  async changeStatus(
    orderId: number,
    status: string,
    token: string,
  ) {
    try {
      console.log("order status: ", status)
      const res = await axios.patch(
        `${API_BASE_URL}/orders/${orderId}/status/${status}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return res.data;
    } catch (error: any) {
      console.error(
        'Lỗi khi thay đổi trạng thái đơn hàng:',
        error.response?.data || error.message
      );
      throw error;
    }
  },

  changeStatusByUser: async (
    userId: number,
    orderId: number,
    status: string,
    note?: string
  ) => {
    const res = await api.patch(
      `${API_ENDPOINTS.users}/${userId}/orders/${orderId}/status/${status}`,
      { note }
    );
    return res.data;
  },

  findByPaymentUuid: async (userId: number, paymentUuid: string) => {
    const res = await api.get(
      `${API_ENDPOINTS.users}/${userId}/orders/payment/${paymentUuid}`
    );
    return res.data;
  },

  // ========== STORE ENDPOINTS ==========

  getOrdersByStore: async (storeId: number, params?: any) => {
    const res = await api.get(`${API_ENDPOINTS.stores}/${storeId}/orders`, {
      params,
    });
    return res.data;
  },

  getStoreOrderDetail: async (storeId: number, orderId: number) => {
    const res = await api.get(
      `${API_ENDPOINTS.stores}/${storeId}/orders/${orderId}`
    );
    return res.data;
  },

  changeStatusByStore: async (
    storeId: number,
    orderId: number,
    status: string,
    note?: string
  ) => {
    const res = await api.patch(
      `${API_ENDPOINTS.stores}/${storeId}/orders/${orderId}/status/${status}`,
      { note }
    );
    return res.data;
  },

  getStoreRevenue: async (storeId: number) => {
    const res = await api.get(
      `${API_ENDPOINTS.stores}/${storeId}/orders/reports/revenue`
    );
    return res.data;
  },

  getStoreStats: async (storeId: number) => {
    const res = await api.get(
      `${API_ENDPOINTS.stores}/${storeId}/orders/reports/stats`
    );
    return res.data;
  },
  getOrderStats: async (storeId: number) => {
    const token = localStorage.getItem('token');
    const res = await axios.get(
      `${API_BASE_URL}/stores/${storeId}/orders/stats`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  },



  getAllOrders: async () => {
    const res = await api.get(`${API_ENDPOINTS.admin}/orders`);
    return res.data;
  },

  getAdminOrderDetail: async (orderId: number) => {
    const res = await api.get(`${API_ENDPOINTS.admin}/orders/${orderId}`);
    return res.data;
  },

  createOrderAdmin: async (payload: any) => {
    const res = await api.post(`${API_ENDPOINTS.admin}/orders`, payload);
    return res.data;
  },

  updateOrderAdmin: async (orderId: number, payload: any) => {
    const res = await api.patch(
      `${API_ENDPOINTS.admin}/orders/${orderId}`,
      payload
    );
    return res.data;
  },

  deleteOrderAdmin: async (orderId: number) => {
    const res = await api.delete(`${API_ENDPOINTS.admin}/orders/${orderId}`);
    return res.data;
  },

  getAdminRevenue: async () => {
    const res = await api.get(`${API_ENDPOINTS.admin}/orders/reports/revenue`);
    return res.data;
  },
};
