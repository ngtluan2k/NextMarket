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
  programId?: number; // optional; backend may ignore if not supported
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

export type ProgramsResponse = { data?: Program[] } | Program[];
