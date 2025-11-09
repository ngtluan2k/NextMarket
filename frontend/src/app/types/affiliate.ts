export interface AffiliateProgram {
  id: number;
  uuid: string;
  name: string;
  cookie_days: number | null;
  commission_type: 'percentage' | 'fixed' | null;
  commission_value: number | null;
  status: 'active' | 'inactive' | 'paused';
  created_at: string;
  user_enrolled: number;
  
  // Budget fields
  total_budget_amount?: number;
  spent_budget?: number;
  pending_budget?: number;
  monthly_budget_cap?: number;
  daily_budget_cap?: number;
  auto_pause_on_budget_limit?: boolean;
  paused_reason?: string;
}

export interface AffiliateProgramFormData {
  name?: string;
  cookie_days?: number;
  commission_type?: 'percentage' | 'fixed';
  commission_value?: number;
  status: 'active' | 'inactive' | 'paused';
  
  // Budget fields
  total_budget_amount?: number;
  monthly_budget_cap?: number;
  daily_budget_cap?: number;
  auto_pause_on_budget_limit?: boolean;
}

export interface CreateAffiliateProgramDto {
  name: string;
  cookie_days: number;
  commission_type: 'percentage' | 'fixed';
  commission_value: number;
  status: 'active' | 'inactive' | 'paused';
  
  // Budget fields
  total_budget_amount?: number;
  monthly_budget_cap?: number;
  daily_budget_cap?: number;
  auto_pause_on_budget_limit?: boolean;
}
