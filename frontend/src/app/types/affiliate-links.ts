export interface DashboardStats {
  totalRevenue: string;
  totalPending: string;
  totalPaid: string;
  totalLinks: number;
  totalBuyers: number;
}


export interface CreateAffiliateLinkPayload {
  productId: number;
  variantId?: number;
}

export interface AffiliateLink {
  link_id: number;
  productId: number;
  variantId: number;
  affiliate_links: string;
  program_name: string;
  created_at: string;
}

export interface AffiliateProduct {
  id: number;
  name: string;
  slug: string;
  thumbnail: string;
}

export interface AffiliateCommission {
  id: number;
  amount: number;
  status: 'pending' | 'approved' | 'paid' | 'canceled';
  created_at: string;
}

export type MyLink = {
  link_id: number;
  productId?: number;
  variantId?: number;
  programId?: number;
  affiliate_link?: string | null;
  program_name?: string;
  created_at?: string;
};

export type MyLinksResponse = {
  message: string;
  links: MyLink[];
};

export type CreateLinkRequest = {
  productId: number;
  variantId?: number; 
  programId?: number;
};

export type CreateLinkResponse = {
  link_id: number;
  affiliate_link: string;
  productId?: number;
  variantId?: number;
};

export type AffiliatedProduct = {
  id: number;
  name?: string;
  base_price?: number | string;
  created_at?: string;
  media?: Array<{
    id: number;
    media_type: string;
    url: string;
    is_primary: boolean;
    sort_order: number;
  }>;
  store?: {
    id: number;
    name: string;
  };
  variants?: Array<{
    id: number;
    sku: string;
    variant_name: string;
    price: string | number;
    stock: number;
  }>;
  brand?: {
    id: number;
    name: string;
  };
};

export type AffiliatedProductsResponse = {
  message: string;
  data?: AffiliatedProduct[];
  products?: AffiliatedProduct[];
};

export type Program = {
  id: number;
  name: string;
  status?: string;
};



export interface CommissionSummaryPeriod {
  period: string;
  totalEarned: number;
  totalPending: number;
  totalPaid: number;
  totalCommissions: number;
  totalOrders: number;
}

export type ProgramsResponse = { data?: Program[] } | Program[];


export interface ProductSearchResult {
  id: number;
  name: string;
  description: string;
  base_price: number;
  image?: string;
  media: Array<{
    id: number;
    url: string;
    media_type: string;
    is_primary: boolean;
    sort_order?: number;
  }>;
  store: {
    id: number;
    name: string;
  };
  brand: {
    id: number;
    name: string;
  };
  categories: Array<{
    id: number;
    name: string;
  }>;
  variants: Array<{
    id: number;
    name: string;
    sku: string;
    price: number;
    stock: number;
  }>;
}

export interface ProductSearchResponse {
  products: ProductSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


export interface BalanceInfo {
  availableBalance: number;
  pendingBalance: number;
  totalEarned: number;
}


export interface CommissionHistoryItem {
  id: string;
  amount: number;
  rate_percent: number;
  status: 'PENDING' | 'PAID';
  level: number;
  created_at: string;
  product: {
    id: number;
    name: string;
    image?: string;
  };
  order: {
    id: number;
    order_number: string;
    total_amount: number;
    created_at: string;
  };
  affiliate_link: {
    id: number;
    code: string;
  };
}

export interface CommissionHistory {
  commissions: CommissionHistoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== GROUP AFFILIATE LINKS ====================

export interface CreateGroupAffiliateLinkRequest {
  storeId: number;
  programId?: number;
  groupName?: string;
  targetMemberCount?: number;
  expiresAt?: string;
}

export interface CreateGroupAffiliateLinkResponse {
  group_id: number;
  group_uuid: string;
  link_id: number;
  invite_link: string;
  join_code: string;
  affiliate_code: string;
  program_id?: number;
  program_name?: string;
  expires_at?: string;
  target_member_count: number;
  created_at: string;
}

export interface MyGroupLink {
  group_id: number;
  group_uuid: string;
  name: string;
  status: 'open' | 'locked' | 'completed' | 'cancelled';
  invite_link: string;
  join_code: string;
  affiliate_code: string;
  program_id?: number;
  store_name: string;
  expires_at?: string;
  target_member_count: number;
  created_at: string;
}

export interface MyGroupLinksResponse {
  message: string;
  group_links: MyGroupLink[];
}