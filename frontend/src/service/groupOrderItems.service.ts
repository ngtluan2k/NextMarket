import { api } from '../app/api/api'
const BASE = 'http://localhost:3000';

export type GroupOrderItemPayload = {
  productId: number;
  variantId?: number;
  quantity: number;
  note?: string;
};

export const groupOrderItemsApi = {
  list: async (groupId: number) => {
    const res = await api.get(`${BASE}/group-orders/${groupId}/items`);
    return res.data;
  },

  listByMember: async (groupId: number, memberId: number) => {
    const res = await api.get(`${BASE}/group-orders/${groupId}/items/by-member/${memberId}`);
    return res.data;
  },

  add: async (groupId: number, payload: GroupOrderItemPayload) => {
    const res = await api.post(`${BASE}/group-orders/${groupId}/items`, payload);
    return res.data;
  },

  update: async (groupId: number, itemId: number, payload: Partial<Omit<GroupOrderItemPayload, 'productId'>>) => {
    const res = await api.patch(`/group-orders/${groupId}/items/${itemId}`, payload);
    return res.data;
  },

  remove: async (groupId: number, itemId: number) => {
    const res = await api.delete(`/group-orders/${groupId}/items/${itemId}`);
    return res.data;
  },
};