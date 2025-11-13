import { BE_BASE_URL } from "../../app/api/api";

export type CommissionRule = {
  id: string; // UUID from backend
  program_id: string | null; // String ID from backend
  name: string;
  total_budget: number;
  num_levels: number;
  calculation_method: CalculationMethod;
  decay_rate?: number;
  starting_index?: number;
  weights?: number[];
  calculated_rates: {
    level: number;
    rate: number;
    weight?: number;
  }[];
  cap_order?: number;
  cap_user?: number;
  time_limit_days?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CommissionPreview = {
  level: number;
  ratePercent: number;
  baseAmount: number;
  commissionAmount: number;
  capPerOrder: number | null;
  hasCap: boolean;
  applied: boolean;
  note?: string;
};

export type PreviewCommissionRequest = {
  amount: number;
  maxLevels: number;
  programId?: number | null;
};

export type PreviewCommissionResponse = {
  inputAmount: number;
  maxLevels: number;
  programId: number | null;
  totalCommission: number;
  totalPercentage: number;
  byLevel: CommissionPreview[];
  summary: {
    levelsWithCommission: number;
    averageRate: number;
    totalCommissionFormatted: string;
  };
};

export type CalculateMethod = {
  uuid: string;
  name: string;
  description: string;
};

// New types for the updated preview API
export enum CalculationMethod {
  GEOMETRIC_DECAY = 'GEOMETRIC_DECAY',
  FIBONACCI_RATIO = 'FIBONACCI_RATIO',
  WEIGHTED_CUSTOM = 'WEIGHTED_CUSTOM'
}

export type PreviewRuleRequest = {
  total_budget: number;
  num_levels: number;
  method: CalculationMethod;
  decay_rate?: number;
  starting_index?: number;
  weights?: number[];
  round_to?: number;
};

export type LevelRate = {
  level: number;
  rate: number;
  weight?: number;
};

export type PreviewRuleResponse = {
  levels: LevelRate[];
  total: number;
  method: CalculationMethod;
  warnings?: string[];
  suggestions?: string[];
};

function authHeaders() {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  } as Record<string, string>;
}

export async function listRules(): Promise<CommissionRule[]> {
  const res = await fetch(`${BE_BASE_URL}/affiliate-rules`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch rules (${res.status})`);
  return await res.json();
}

export async function createRule(
  body: Partial<CommissionRule> & { level: number; rate_percent: number }
) {
  const res = await fetch(`${BE_BASE_URL}/affiliate-rules`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create rule (${res.status})`);
  return await res.json();
}

// New create rule function for the updated API
export async function createNewRule(body: any) {
  const res = await fetch(`${BE_BASE_URL}/affiliate-rules`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create rule (${res.status})`);
  return await res.json();
}

export async function updateRule(id: string, body: any) {
  const res = await fetch(`${BE_BASE_URL}/affiliate-rules/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to update rule (${res.status})`);
  return await res.json();
}

export async function deleteRule(id: string) {
  const res = await fetch(`${BE_BASE_URL}/affiliate-rules/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete rule (${res.status})`);
  return await res.json();
}

export async function previewCommission(
  request: PreviewCommissionRequest
): Promise<PreviewCommissionResponse> {
  const res = await fetch(
    `${BE_BASE_URL}/affiliate-rules/preview-commission`,
    {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(request),
    }
  );
  if (!res.ok) throw new Error(`Failed to preview commission (${res.status})`);
  return await res.json();
}

export async function createDefaultRulesForProgram(programId: number) {
  const res = await fetch(
    `${BE_BASE_URL}/affiliate-rules/create-default/${programId}`,
    {
      method: 'POST',
      headers: authHeaders(),
    }
  );
  if (!res.ok)
    throw new Error(`Failed to create default rules (${res.status})`);
  return await res.json();
}

export async function getAllCalculateMethod(): Promise<CalculateMethod[]> {
  const res = await fetch(`${BE_BASE_URL}/calculation-method`, {
    method: 'GET',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to get calculate methods (${res.status})`);
  return await res.json();
}

// New preview API function for calculation methods
export async function previewRuleCalculation(
  request: PreviewRuleRequest
): Promise<PreviewRuleResponse> {
  console.log('Sending preview request:', request);
  const res = await fetch(`${BE_BASE_URL}/affiliate-rules/preview`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(request),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Preview API error response:', errorText);
    throw new Error(`Failed to preview rule calculation (${res.status}): ${errorText}`);
  }
  
  return await res.json();
}
