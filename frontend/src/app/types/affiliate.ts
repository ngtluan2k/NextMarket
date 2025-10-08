export interface AffiliateProgram {
  id: number;
  uuid: string;
  name: string;
  cookie_days: number | null;
  commission_type: 'percentage' | 'fixed' | null;
  commission_value: number | null;
  status: 'active' | 'inactive';
  created_at: string;
  user_enrolled?: number;
}

export interface AffiliateProgramFormData {
  name?: string;
  cookie_days?: number;
  commission_type?: 'percentage' | 'fixed';
  commission_value?: number;
  status: 'active' | 'inactive';
}

export interface CreateAffiliateProgramDto {
  name: string;
  cookie_days: number;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  status: 'active' | 'inactive';
}
