export type CommissionRule = {
  id: number;
  program_id: number | null;
  level: number;
  rate_percent: string | number;
  active_from: string | null;
  active_to: string | null;
  cap_per_order: string | null;
  cap_per_user: string | null;
};

const API_BASE = 'http://localhost:3000';

function authHeaders() {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  } as Record<string, string>;
}

export async function listRules(): Promise<CommissionRule[]> {
  const res = await fetch(`${API_BASE}/affiliate-rules`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch rules (${res.status})`);
  return await res.json();
}

export async function createRule(body: Partial<CommissionRule> & { level: number; rate_percent: number }) {
  const res = await fetch(`${API_BASE}/affiliate-rules`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to create rule (${res.status})`);
  return await res.json();
}

export async function updateRule(id: number, body: Partial<CommissionRule>) {
  const res = await fetch(`${API_BASE}/affiliate-rules/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Failed to update rule (${res.status})`);
  return await res.json();
}

export async function deleteRule(id: number) {
  const res = await fetch(`${API_BASE}/affiliate-rules/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to delete rule (${res.status})`);
  return await res.json();
}


