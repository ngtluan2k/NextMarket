import { api, API_ENDPOINTS } from '../app/api/api'

export const orderService = {
  // ========== USER ENDPOINTS ==========

  getOrdersByUser: async (userId: number, params?: any) => {
    const res = await api.get(`${API_ENDPOINTS.users}/${userId}/orders`, { params });
    return res.data;
  },

  getOrderDetail: async (userId: number, orderId: number) => {
    const res = await api.get(`${API_ENDPOINTS.users}/${userId}/orders/${orderId}`);
    return res.data;
  },

  createOrder: async (userId: number, payload: any) => {
    const res = await api.post(`${API_ENDPOINTS.users}/${userId}/orders`, payload);
    return res.data;
  },

  changeStatusByUser: async (userId: number, orderId: number, status: string, note?: string) => {
    const res = await api.patch(
      `${API_ENDPOINTS.users}/${userId}/orders/${orderId}/status/${status}`,
      { note }
    );
    return res.data;
  },

   findByPaymentUuid: async (userId: number, paymentUuid: string) => {
  const res = await api.get(`${API_ENDPOINTS.users}/${userId}/orders/payment/${paymentUuid}`);
  return res.data;
},

  // ========== STORE ENDPOINTS ==========

  getOrdersByStore: async (storeId: number, params?: any) => {
    const res = await api.get(`${API_ENDPOINTS.stores}/${storeId}/orders`, { params });
    return res.data;
  },

  getStoreOrderDetail: async (storeId: number, orderId: number) => {
    const res = await api.get(`${API_ENDPOINTS.stores}/${storeId}/orders/${orderId}`);
    return res.data;
  },

  changeStatusByStore: async (storeId: number, orderId: number, status: string, note?: string) => {
    const res = await api.patch(
      `${API_ENDPOINTS.stores}/${storeId}/orders/${orderId}/status/${status}`,
      { note }
    );
    return res.data;
  },

  getStoreRevenue: async (storeId: number) => {
    const res = await api.get(`${API_ENDPOINTS.stores}/${storeId}/orders/reports/revenue`);
    return res.data;
  },

  getStoreStats: async (storeId: number) => {
    const res = await api.get(`${API_ENDPOINTS.stores}/${storeId}/orders/reports/stats`);
    return res.data;
  },

  // ========== ADMIN ENDPOINTS ==========

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
    const res = await api.patch(`${API_ENDPOINTS.admin}/orders/${orderId}`, payload);
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
