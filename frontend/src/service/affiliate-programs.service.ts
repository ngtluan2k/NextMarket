// affiliate-programs.service.ts
export type AffiliateProgram = {
  id: number;
  uuid: string;
  name: string;
  cookie_days: number;
  commission_type: string;
  commission_value: number;
  status: string;
  created_at: string;
};

const API_BASE = 'http://localhost:3000';

function authHeaders() {
  const token = localStorage.getItem('token') || '';
  return {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  } as Record<string, string>;
}

export async function getAllAffiliatePrograms(): Promise<AffiliateProgram[]> {
  console.log('🔍 Fetching affiliate programs...');
  const res = await fetch(`${API_BASE}/affiliate-programs`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch programs (${res.status})`);
  const programs = await res.json();
  console.log(`✅ Found ${programs.length} affiliate programs:`, programs);
  return programs;
}

export async function getActiveAffiliatePrograms(): Promise<AffiliateProgram[]> {
  console.log('🔍 Fetching active affiliate programs...');
  const res = await fetch(`${API_BASE}/affiliate-programs`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch active programs (${res.status})`);
  const programs = await res.json();
  const activePrograms = programs.filter((p: AffiliateProgram) => p.status === 'active');
  console.log(`✅ Found ${activePrograms.length} active affiliate programs:`, activePrograms);
  return activePrograms;
}
