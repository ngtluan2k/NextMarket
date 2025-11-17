import { TreeDataNode } from "antd";

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

