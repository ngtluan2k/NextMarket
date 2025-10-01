export type Voucher = {
  id: number;
  uuid: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  start_date: string;
  end_date: string;
  usage_limit: number;
  used_count: number;
  applicable_store_ids?: number[]; // Thêm để kiểm tra store
  store?: { id: number; name: string }; // Thêm thông tin store (nếu API trả về)
};
