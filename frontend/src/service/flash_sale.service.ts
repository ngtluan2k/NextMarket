// services/flashSaleService.ts
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_BE_BASE_URL}/flash-sale-schedules`; // 👈 chỉnh URL cho đúng

///////////////////////////ADMIN//////////////////////////

// ⚡ 1. Admin tạo flash sale schedule
export async function createFlashSaleSchedule(
  dto: {
    name: string;
    description?: string;
    starts_at: string | Date;
    ends_at: string | Date;
  },
  token: string
) {
  const res = await axios.post(`${API_URL}`, dto, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateFlashSaleSchedule(
  scheduleId: number,
  dto: {
    name?: string;
    description?: string;
    starts_at?: string | Date;
    ends_at?: string | Date;
  },
  token: string
) {
  const res = await axios.patch(`${API_URL}/${scheduleId}`, dto, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ⚡ 2. Admin xem tất cả flash sale
export async function getAllFlashSalesForAdmin(token: string) {
  const res = await axios.get(`${API_URL}/admin`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function getRegisteredProductsForAdmin(
  scheduleId: number,
  token: string
) {
  const res = await axios.get(
    `${API_URL}/${scheduleId}/registered-products/admin`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
}

////////////////////////////STORE//////////////////////////

// ⚡ 3. Store xem tất cả flash sale (mọi trạng thái)
export async function getAllFlashSalesForStore(token: string) {
  const res = await axios.get(`${API_URL}/store`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ⚡ 4. Store đăng ký flash sale
export async function registerStoreFlashSale(
  storeId: number,
  dto: {
    schedule_id: number;
    product_variant_ids: {
      product_id: number;
      variant_id?: number;
      price: number;
      limit_quantity: number;
    }[];
  },
  token: string
) {
  const res = await axios.post(`${API_URL}/store/register`, dto, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

// ⚡ 5. Store xem sản phẩm đã đăng ký trong flash sale cụ thể
export async function getRegisteredProductsForStore(
  scheduleId: number,
  token: string
) {
  const res = await axios.get(`${API_URL}/${scheduleId}/registered-products`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function updateStoreRegistration(
  scheduleId: number,
  dto: {
    product_variant_ids: {
      product_id: number;
      variant_id?: number;
      price: number;
      limit_quantity: number;
    }[];
  },
  token: string
) {
  const res = await axios.patch(`${API_URL}/${scheduleId}/register`, dto, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
