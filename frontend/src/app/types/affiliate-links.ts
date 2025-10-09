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
  created_at?: string;
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
