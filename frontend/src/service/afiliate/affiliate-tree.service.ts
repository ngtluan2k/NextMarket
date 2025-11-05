import { API_BASE_URL } from "../../app/api/api";

function authHeaders() {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  } as Record<string, string>;
}

export async function fetchAncestors(userId: number, page = 1, pageSize = 20) {
  const url = new URL(`${API_BASE_URL}/admin/affiliate-tree/upline`);
  url.searchParams.set('userId', String(userId));
  url.searchParams.set('page', String(page));
  url.searchParams.set('pageSize', String(pageSize));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch downline (${res.status})`);
  return await res.json();
}

export async function fetchDescendants(userId: number, maxDepth = 10) {
  const url = new URL(`${API_BASE_URL}/admin/affiliate-tree/downline`);
  url.searchParams.set('userId', String(userId));
  url.searchParams.set('maxDepth', String(maxDepth));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch upline (${res.status})`);
  return await res.json();
}

// API mới cho affiliate tree với commission
export async function fetchAffiliateTreeWithCommissions(userId: number, maxDepth = 10) {
  const url = new URL(`${API_BASE_URL}/admin/affiliate-tree/with-commissions/${userId}`);
  url.searchParams.set('maxDepth', String(maxDepth));
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch affiliate tree with commissions (${res.status})`);
  return await res.json();
}

export async function fetchCommissionSummary(userId: number) {
  const url = new URL(`${API_BASE_URL}/admin/affiliate-tree/commission-summary/${userId}`);
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch commission summary (${res.status})`);
  return await res.json();
}

export async function fetchCommissionRules(level: number, programId?: number) {
  const url = new URL(`${API_BASE_URL}/admin/affiliate-tree/commission-rules/${level}`);
  if (programId) {
    url.searchParams.set('programId', String(programId));
  }
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch commission rules (${res.status})`);
  return await res.json();
}

// API cho admin quy định mức affiliate
export async function setCommissionRulesForUsers(rules: any[], programId?: number) {
  const res = await fetch(`${API_BASE_URL}/admin/affiliate-tree/set-commission-rules`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ rules, programId }),
  });
  if (!res.ok) throw new Error(`Failed to set commission rules (${res.status})`);
  return await res.json();
}

export async function fetchCommissionRulesForUsers(userIds: number[], programId?: number) {
  const url = new URL(`${API_BASE_URL}/admin/affiliate-tree/commission-rules-for-users`);
  url.searchParams.set('userIds', userIds.join(','));
  if (programId) {
    url.searchParams.set('programId', String(programId));
  }
  const res = await fetch(url.toString(), { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch commission rules for users (${res.status})`);
  return await res.json();
}


