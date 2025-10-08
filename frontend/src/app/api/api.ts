  import axios from "axios";

  export const API_BASE_URL = "http://localhost:3000";

  export const API_ENDPOINTS = {
    products: `${API_BASE_URL}/products`,
    orders: `${API_BASE_URL}/orders`,
    cart: `${API_BASE_URL}/cart`,
    users: `${API_BASE_URL}/users`,
    stores: `${API_BASE_URL}/stores`,
    admin: `${API_BASE_URL}/admin`,
    auth: `${API_BASE_URL}/auth`,
    provinces: `${API_BASE_URL}/provinces`,
    adminVouchers: `${API_BASE_URL}/admin/vouchers`,
    storeOwnerVouchers: `${API_BASE_URL}/store-owner/vouchers`,
    userVouchers: `${API_BASE_URL}/user/vouchers`,
  };

  export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      "Content-Type": "application/json",
    },
  });
  api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
  // =============================
  // PROVINCES API (v1 & v2 tách riêng)
  // =============================
  export const provincesApi = {
    
    // Provinces
    getProvincesV1: async () => {
      const res = await api.get(`${API_ENDPOINTS.provinces}?version=v1`);
      return res.data;
    },
    getProvincesV2: async () => {
      const res = await api.get(`${API_ENDPOINTS.provinces}?version=v2`);
      return res.data;
    },

    // Districts
    getDistrictsV1: async (provinceCode: number) => {
      const res = await api.get(
        `${API_ENDPOINTS.provinces}/${provinceCode}/districts?version=v1`
      );
      return res.data;
    },
    getDistrictsV2: async (provinceCode: number) => {
      const res = await api.get(
        `${API_ENDPOINTS.provinces}/${provinceCode}/districts?version=v2`
      );
      return res.data;
    },

    // Wards
    getWardsV1: async (districtCode: number) => {
      const res = await api.get(
        `${API_ENDPOINTS.provinces}/districts/${districtCode}/wards?version=v1`
      );
      return res.data;
    },
    getWardsV2: async (districtCode: number) => {
      const res = await api.get(
        `${API_ENDPOINTS.provinces}/districts/${districtCode}/wards?version=v2`
      );
      return res.data;
    },
  };

  // =============================
  // USER API
  // =============================
  export const userApi = {
  getMe: async () => {
    const res = await api.get(`${API_ENDPOINTS.users}/me`);
    return res.data;
  },

  getAddresses: async (userId: number) => {
    const res = await api.get(`${API_ENDPOINTS.users}/${userId}/addresses`);
    return res.data;
  },

  addAddress: async (userId: number, payload: any) => {
    // payload phải có user_id = userId
    const res = await api.post(`${API_ENDPOINTS.users}/${userId}/addresses`, {
      ...payload,
      user_id: userId,
    });
    return res.data;
  },

  updateAddress: async (userId: number, addressId: number, payload: any) => {
    const res = await api.put(
      `${API_ENDPOINTS.users}/${userId}/addresses/${addressId}`,
      payload
    );
    return res.data;
  },

  deleteAddress: async (userId: number, addressId: number) => {
    const res = await api.delete(
      `${API_ENDPOINTS.users}/${userId}/addresses/${addressId}`
    );
    return res.data;
  },
};
