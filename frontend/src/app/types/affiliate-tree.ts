// TreeDataNode import removed as it's not used in user affiliate tree types

export interface CommissionInfo {
  totalEarned: number;
  totalPending: number;
  totalPaid: number;
  currentLevel: number;
  ratePercent: number;
}

export interface UserInfo {
  id: number;
  uuid: string;
  user_id: number;
  full_name: string;
  dob: string;
  phone: string;
  gender: string;
  avatar_url: string | null;
  country: string;
  created_at: string;
  user: {
    id: number;
    uuid: string;
    username: string;
    email: string;
    status: string;
    code: string;
    created_at: string;
    updated_at: string | null;
    is_affiliate: boolean;
  };
}

export interface AffiliateTreeNode {
  userId: number;
  level: number;
  user: UserInfo | null;
  commission: CommissionInfo;
}

/**
 * USER AFFILIATE TREE TYPES
 * Privacy-compliant types for user downline tree
 */

export interface DownlineInfo {
  affiliateCode: string;
  level: number;
  joinedDate: string;
  totalOrders: number;
  totalRevenue: number;
  totalCommissionGenerated: number;
  status: 'active' | 'inactive';
  lastOrderDate?: string;
  directReferrals: number;
  totalDownlines: number;
  performanceTier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface UserDownlineTreeResponse {
  totalDownlines: number;
  activeDownlines: number;
  totalRevenue: number;
  tree: DownlineInfo[];
}

export interface LevelBreakdown {
  level: number;
  count: number;
}

export interface RecentPerformance {
  orders: number;
  revenue: number;
  commissions: number;
  commissionAmount: number;
}

export interface UserAffiliateStats {
  levelBreakdown: LevelBreakdown[];
  totalDownlines: number;
  commission: CommissionInfo;
  recentPerformance: RecentPerformance;
}

