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

    const res = await api.get(`${ENDPOINTS.adminVouchers}/voucher-system`, {
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
   * Get user's COLLECTED vouchers (chỉ voucher đã thu thập)
   * @returns Array of user's collected vouchers
   */
  getMyCollectedVouchers: async (): Promise<Voucher[]> => {
    const res = await api.get(`${ENDPOINTS.userVouchers}/my-vouchers`);
    return res.data;
  },

  /**
   * Get available vouchers for COLLECTION (chưa thu thập)
   * @returns Array of vouchers user can collect
   */
  getAvailableVouchersForCollection: async (): Promise<Voucher[]> => {
    const res = await api.get(`${ENDPOINTS.userVouchers}/available-for-collection`);
    return res.data;
  },

  /**
   * Get ALL platform vouchers (both collected and available - for backward compatibility)
   * @returns Array of all platform vouchers
   * @deprecated Use getMyCollectedVouchers or getAvailableVouchersForCollection instead
   */
  getMyVouchers: async (): Promise<Voucher[]> => {
    const res = await api.get(`${ENDPOINTS.userVouchers}/all-platform-vouchers`);
    return res.data;
  },

  /**
   * Get available vouchers for user (for shopping cart)
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

  /**
   * Collect a voucher
   * @param id - Voucher ID to collect
   * @returns Promise<void>
   */
  collectVoucher: async (id: number): Promise<void> => {
    const res = await api.post(`${ENDPOINTS.userVouchers}/collect/${id}`);
    return res.data;
  },

  /**
   * Apply voucher to order
   * @param payload - Apply voucher data
   * @returns Voucher and discount information
   */
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
  /**
   * Get active vouchers (public)
   * @returns Array of active vouchers
   */
  getActiveVouchers: async (): Promise<Voucher[]> => {
    const res = await api.get(`${ENDPOINTS.vouchers}/active`);
    return res.data;
  },

  /**
   * Validate a voucher code
   * @param payload - Voucher validation data
   * @returns Voucher and discount information
   */
  validateVoucher: async (payload: {
    code: string;
    order_amount: number;
    store_id?: number;
  }): Promise<{ voucher: Voucher; discount: number }> => {
    const res = await api.post(`${ENDPOINTS.vouchers}/validate`, payload);
    return res.data;
  },

  /**
   * Calculate discount for multiple voucher codes
   * @param payload - Calculate discount data
   * @returns Discount calculation result
   */
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

// =============================
// VOUCHER COLLECTION API (NEW)
// =============================
export const voucherCollectionApi = {
  /**
   * Get user's voucher collection (detailed info)
   * @returns Array of collected vouchers with usage info
   */
  getMyCollection: async (): Promise<Voucher[]> => {
    const res = await api.get(`${ENDPOINTS.userVouchers}/my-collection`);
    return res.data;
  },

  /**
   * Check if user has collected a specific voucher
   * @param voucherId - Voucher ID to check
   * @returns Boolean indicating if voucher is collected
   */
  checkVoucherCollected: async (voucherId: number): Promise<{ collected: boolean }> => {
    const res = await api.get(`${ENDPOINTS.userVouchers}/check-collected/${voucherId}`);
    return res.data;
  },

  /**
   * Get collection statistics
   * @returns Collection statistics
   */
  getCollectionStats: async (): Promise<{
    totalCollected: number;
    totalAvailable: number;
    totalUsed: number;
    totalExpired: number;
  }> => {
    const res = await api.get(`${ENDPOINTS.userVouchers}/collection-stats`);
    return res.data;
  },
};

// =============================
// VOUCHER DISCOVERY API (NEW)
// =============================
export const voucherDiscoveryApi = {
  /**
   * Discover new vouchers available for collection
   * @param limit - Maximum number of vouchers to return
   * @returns Array of discoverable vouchers
   */
  discoverVouchers: async (limit?: number): Promise<Voucher[]> => {
    const params = new URLSearchParams();
    if (limit) {
      params.append('limit', limit.toString());
    }
    
    const queryString = params.toString();
    const url = queryString 
      ? `${ENDPOINTS.userVouchers}/discover?${queryString}`
      : `${ENDPOINTS.userVouchers}/discover`;
    
    const res = await api.get<Voucher[]>(url);
    return res.data;
  },

  /**
   * Get recommended vouchers based on user behavior
   * @returns Array of recommended vouchers
   */
  getRecommendedVouchers: async (): Promise<Voucher[]> => {
    const res = await api.get(`${ENDPOINTS.userVouchers}/recommended`);
    return res.data;
  },

  /**
   * Get trending vouchers
   * @returns Array of trending vouchers
   */
  getTrendingVouchers: async (): Promise<Voucher[]> => {
    const res = await api.get(`${ENDPOINTS.userVouchers}/trending`);
    return res.data;
  },
};

// =============================
// COMPOSITE API METHODS
// =============================
export const compositeVoucherApi = {
  /**
   * Get complete voucher overview for user
   * @returns Complete voucher overview
   */
  getVoucherOverview: async (): Promise<{
    collected: Voucher[];
    availableForCollection: Voucher[];
    recommended: Voucher[];
    stats: {
      totalCollected: number;
      totalAvailable: number;
      totalUsed: number;
    };
  }> => {
    const [collected, available, recommended, stats] = await Promise.all([
      userVoucherApi.getMyCollectedVouchers(),
      userVoucherApi.getAvailableVouchersForCollection(),
      voucherDiscoveryApi.getRecommendedVouchers(),
      voucherCollectionApi.getCollectionStats(),
    ]);

    return {
      collected,
      availableForCollection: available,
      recommended,
      stats,
    };
  },

  /**
   * Collect multiple vouchers at once
   * @param voucherIds - Array of voucher IDs to collect
   * @returns Collection results
   */
  collectMultipleVouchers: async (voucherIds: number[]): Promise<{
    success: number[];
    failed: Array<{ id: number; error: string }>;
  }> => {
    const results = await Promise.allSettled(
      voucherIds.map(id => userVoucherApi.collectVoucher(id))
    );

    const success: number[] = [];
    const failed: Array<{ id: number; error: string }> = [];

    results.forEach((result, index) => {
      const voucherId = voucherIds[index];
      if (result.status === 'fulfilled') {
        success.push(voucherId);
      } else {
        failed.push({
          id: voucherId,
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    return { success, failed };
  },
};

// Export all APIs for convenience
export default {
  voucherApi,
  storeOwnerVoucherApi,
  userVoucherApi,
  publicVoucherApi,
  voucherCollectionApi,
  voucherDiscoveryApi,
  compositeVoucherApi,
};