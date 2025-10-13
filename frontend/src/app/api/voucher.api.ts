// src/api/voucher.api.ts
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
  // Get available vouchers for user
  getAvailableVouchers: async (): Promise<Voucher[]> => {
    const res = await api.get(`${ENDPOINTS.userVouchers}/available`);
    return res.data;
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
