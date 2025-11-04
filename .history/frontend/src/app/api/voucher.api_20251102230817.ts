import { api } from './api';
import type {
  Voucher,
  CreateVoucherPayload,
  UpdateVoucherPayload,
} from '../types/voucher';

const ENDPOINTS = {
  adminVouchers: '/admin/vouchers',
  storeOwnerVouchers: '/store-owner/vouchers',
  userVouchers: '/user/vouchers',
  vouchers: '/vouchers',
};

// =============================
// ADMIN VOUCHER API
// =============================
export const voucherApi = {
  // Get all vouchers (admin only)
  getAllVouchers: async (): Promise<Voucher[]> => {
    const res = await api.get(ENDPOINTS.adminVouchers);
    return res.data;
  },

   getAvailableVoucherOfSystem: async (): Promise<Voucher[]> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Người dùng chưa đăng nhập');

    const res = await api.get(`${ENDPOINTS.adminVouchers}/voucher-system`,  {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  },

  // Get voucher by ID
  getVoucherById: async (id: number): Promise<Voucher> => {
    const res = await api.get(`${ENDPOINTS.adminVouchers}/${id}`);
    return res.data;
  },

  // Create new voucher
  createVoucher: async (payload: CreateVoucherPayload): Promise<Voucher> => {
    const res = await api.post(ENDPOINTS.adminVouchers, payload);
    return res.data;
  },

  // Update voucher
  updateVoucher: async (
    id: number,
    payload: UpdateVoucherPayload
  ): Promise<Voucher> => {
    const res = await api.patch(`${ENDPOINTS.adminVouchers}/${id}`, payload);
    return res.data;
  },

  // Delete voucher
  deleteVoucher: async (id: number): Promise<void> => {
    const res = await api.delete(`${ENDPOINTS.adminVouchers}/${id}`);
    return res.data;
  },
};

// =============================
// STORE OWNER VOUCHER API
// =============================
export const storeOwnerVoucherApi = {
  // Get all vouchers for store owner
  getAllVouchers: async (): Promise<Voucher[]> => {
    const res = await api.get(ENDPOINTS.storeOwnerVouchers);
    return res.data;
  },

  // Get voucher by ID
  getVoucherById: async (id: number): Promise<Voucher> => {
    const res = await api.get(`${ENDPOINTS.storeOwnerVouchers}/${id}`);
    return res.data;
  },

  // Create new voucher
  createVoucher: async (payload: CreateVoucherPayload): Promise<Voucher> => {
    const res = await api.post(ENDPOINTS.storeOwnerVouchers, payload);
    return res.data;
  },

  // Update voucher
  updateVoucher: async (
    id: number,
    payload: UpdateVoucherPayload
  ): Promise<Voucher> => {
    const res = await api.patch(
      `${ENDPOINTS.storeOwnerVouchers}/${id}`,
      payload
    );
    return res.data;
  },

  // Delete voucher
  deleteVoucher: async (id: number): Promise<void> => {
    const res = await api.delete(`${ENDPOINTS.storeOwnerVouchers}/${id}`);
    return res.data;
  },
};

// =============================
// USER VOUCHER API
// =============================
export const userVoucherApi = {
  /**
   * Get user's collected vouchers (available, used, expired)
   * @returns Array of user's vouchers
   */
  getMyVouchers: async (): Promise<Voucher[]> => {
    const res = await api.get(`${ENDPOINTS.userVouchers}/my-vouchers`);
    return res.data;
  },

  /**
   * Get available vouchers for user
   * @param storeId - Optional store ID to filter vouchers
   * @param filterByStoreOnly - If true, exclude admin vouchers (default: false)
   * @returns Array of available vouchers
   */
  getAvailableVouchers: async (
    storeId?: number,
    filterByStoreOnly = false
  ): Promise<Voucher[]> => {
    const params = new URLSearchParams();
    
    if (storeId !== undefined) {
      params.append('storeId', storeId.toString());
    }
    
    if (filterByStoreOnly) {
      params.append('filterByStore', 'true');
    }
    
    const queryString = params.toString();
    const url = queryString 
      ? `${ENDPOINTS.userVouchers}/available?${queryString}`
      : `${ENDPOINTS.userVouchers}/available`;
    
    const res = await api.get<Voucher[]>(url);
    return res.data;
  },

  /**
   * Get available vouchers by store (includes admin vouchers by default)
   * @param storeId - Store ID
   * @param includeAdminVouchers - Include platform-wide vouchers (default: true)
   * @returns Array of available vouchers
   * @deprecated Use getAvailableVouchers instead
   */
  getAvailableVouchersByStore: async (
    storeId: number,
    includeAdminVouchers = true
  ): Promise<Voucher[]> => {
    return userVoucherApi.getAvailableVouchers(storeId, !includeAdminVouchers);
  },

  // Collect a voucher
  collectVoucher: async (id: number): Promise<void> => {
    const res = await api.post(`${ENDPOINTS.userVouchers}/collect/${id}`);
    return res.data;
  },

  // Apply voucher to order
  applyVoucher: async (payload: {
    code: string;
    storeId: number;
    orderItems: Array<{ productId: number; quantity: number; price: number }>;
  }): Promise<{ voucher: Voucher; discount: number }> => {
    const res = await api.post(`${ENDPOINTS.userVouchers}/apply`, payload);
    return res.data;
  },
};

// =============================
// PUBLIC VOUCHER API
// =============================
export const publicVoucherApi = {
  // Get active vouchers (public)
  getActiveVouchers: async (): Promise<Voucher[]> => {
    const res = await api.get(`${ENDPOINTS.vouchers}/active`);
    return res.data;
  },

  // Validate a voucher code
  validateVoucher: async (payload: {
    code: string;
    order_amount: number;
    store_id?: number;
  }): Promise<{ voucher: Voucher; discount: number }> => {
    const res = await api.post(`${ENDPOINTS.vouchers}/validate`, payload);
    return res.data;
  },

  // Calculate discount for multiple voucher codes
  calculateDiscount: async (payload: {
    voucherCodes: string[];
    userId: number;
    orderItems: Array<{ productId: number; quantity: number; price: number }>;
    storeId: number;
    orderAmount: number;
  }): Promise<{
    discountTotal: number;
    appliedVouchers: Array<{
      code: string;
      discount: number;
      type: number;
    }>;
    invalidVouchers: Array<{
      code: string;
      error: string;
    }>;
  }> => {
    const res = await api.post(
      `${ENDPOINTS.vouchers}/calculate-discount`,
      payload
    );
    return res.data;
  },
};