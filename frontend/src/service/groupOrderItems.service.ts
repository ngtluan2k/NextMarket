import { api } from '../app/api/api';


// ==================== TYPES ====================
export type GroupOrderItemPayload = {
  productId: number;
  variantId?: number;
  quantity: number;
  note?: string;
};

export type GroupOrderCheckoutPayload = {
  paymentMethodUuid: string;
  addressId?: number;
};

export type CreateGroupOrderPayload = {
  name: string;
  storeId: number;
  hostUserId: number;
};

export type UpdateGroupOrderPayload = {
  name?: string;
  expiresAt?: string | null;
  delivery_mode?: 'host_address' | 'member_address';
};

export type JoinGroupPayload = {
  userId: number;
  addressId?: number;
};

export type UpdateMemberAddressPayload = {
  addressId: number;
};

// ==================== GROUP ORDERS API ====================
export const groupOrdersApi = {
  // Tạo nhóm mới
  create: async (payload: CreateGroupOrderPayload) => {
    const res = await api.post(`/group-orders`, payload);
    return res.data;
  },

  // Lấy chi tiết nhóm by ID
  getById: async (groupId: number) => {
    const res = await api.get(`/group-orders/${groupId}`);
    return res.data;
  },

  // Lấy nhóm by UUID
  getByUuid: async (uuid: string) => {
    const token = localStorage.getItem('token') || '';
    const res = await api.get(`/group-orders/uuid/${uuid}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  // Update nhóm (name, expiresAt, delivery_mode, etc.)
  update: async (groupId: number, payload: UpdateGroupOrderPayload) => {
    const token = localStorage.getItem('token');
    const res = await api.patch(`/group-orders/${groupId}`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  },

  // Xóa nhóm
  delete: async (groupId: number) => {
    const res = await api.delete(`/group-orders/${groupId}`);
    return res.data;
  },

  // Join nhóm (by groupId)
  join: async (groupId: number, payload: JoinGroupPayload) => {
    const res = await api.post(`/group-orders/${groupId}/join`, payload);
    return res.data;
  },

  // Join nhóm (by UUID)
  joinByUuid: async (uuid: string, payload: JoinGroupPayload) => {
    const token = localStorage.getItem('token') || '';
    const res = await api.post(`/group-orders/join/${uuid}`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.data;
  },

  // Update địa chỉ của member
  updateMemberAddress: async (groupId: number, payload: UpdateMemberAddressPayload) => {
    const token = localStorage.getItem('token');
    const res = await api.patch(
      `/group-orders/${groupId}/members/me/address`,
      payload,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  updateOrderStatusBulk: async (groupId: number, status: number) => {
    const token = localStorage.getItem('token');
    const res = await api.patch(
      `/group-orders/${groupId}/order-status/${status}/bulk`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },

  // Rời nhóm
  leave: async (groupId: number) => {
    const token = localStorage.getItem('token');
    const res = await api.post(
      `/group-orders/${groupId}/leave`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  },
};


// ==================== GROUP ORDER ITEMS API ====================
export const groupOrderItemsApi = {
  // Lấy tất cả items trong group
  list: async (groupId: number) => {
    const res = await api.get(`/group-orders/${groupId}/items`);
    return res.data;
  },

  // Lấy items của 1 member
  listByMember: async (groupId: number, memberId: number) => {
    const res = await api.get(`/group-orders/${groupId}/items/by-member/${memberId}`);
    return res.data;
  },

  // Thêm item vào group
  add: async (groupId: number, payload: GroupOrderItemPayload) => {
    const res = await api.post(`/group-orders/${groupId}/items`, payload);
    return res.data;
  },

  // Update item (quantity, note, etc.)
  update: async (groupId: number, itemId: number, payload: Partial<Omit<GroupOrderItemPayload, 'productId'>>) => {
    const res = await api.patch(`/group-orders/${groupId}/items/${itemId}`, payload);
    return res.data;
  },

  // Xóa item
  remove: async (groupId: number, itemId: number) => {
    const res = await api.delete(`/group-orders/${groupId}/items/${itemId}`);
    return res.data;
  },

  // Checkout toàn bộ nhóm
  checkout: async (groupId: number, payload: GroupOrderCheckoutPayload) => {
    const res = await api.post(`/group-orders/${groupId}/checkout`, payload);
    return res.data;
  },

};

// ==================== OTHER APIS (for checkout) ====================
export const userApi = {
  // Lấy địa chỉ của user
  getAddresses: async (userId: number) => {
    const res = await api.get(`/users/${userId}/addresses`);
    return res.data;
  },
};

export const paymentApi = {
  // Lấy danh sách payment methods
  getPaymentMethods: async () => {
    const res = await api.get('/payment-methods');
    return res.data;
  },
};

export const getGroupOrderWithOrders = async (groupOrderId: number) => {
  const res = await api.get(`/group-orders/${groupOrderId}/with-orders`);
  return res.data.data;
};