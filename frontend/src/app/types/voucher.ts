interface Voucher {
  id: number;
  uuid: string;
  code: string;
  title: string;
  description?: string;
  type: number;
  discount_type: number;
  discount_value: number;
  max_discount_amount?: number;
  min_order_amount: number;
  start_date: string;
  end_date: string;
  total_usage_limit?: number;
  per_user_limit: number;
  total_used_count: number;
  collected_count: number;
  status: number;
  collection_type: number;
  priority: number;
  stackable: boolean;
  new_user_only: boolean;
  image_url?: string;
  theme_color?: string;
  store?: {
    id: number;
    name: string;
  };
}
