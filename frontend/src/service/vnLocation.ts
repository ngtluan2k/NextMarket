// src/services/vnLocation.ts
export type Province = { code: number; name: string };
export type District = { code: number; name: string; province_code: number };
export type Ward = { code: number; name: string; district_code: number };

const BASE = "https://provinces.open-api.vn/api";

const pCache = new Map<number, District[]>(); // provinceCode -> districts
const dCache = new Map<number, Ward[]>();     // districtCode -> wards
let provincesCache: Province[] | null = null;

async function getJSON<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}

export async function getProvinces(): Promise<Province[]> {
  if (provincesCache) return provincesCache;
  // depth=1 -> chỉ tên + code
  const data = await getJSON<Province[]>(`${BASE}/?depth=1`);
  provincesCache = data;
  return data;
}

export async function getDistricts(provinceCode: number): Promise<District[]> {
  if (pCache.has(provinceCode)) return pCache.get(provinceCode)!;
  // /p/{code}?depth=2 -> có mảng districts
  const data = await getJSON<{ districts: District[] }>(`${BASE}/p/${provinceCode}?depth=2`);
  pCache.set(provinceCode, data.districts);
  return data.districts;
}

export async function getWards(districtCode: number): Promise<Ward[]> {
  if (dCache.has(districtCode)) return dCache.get(districtCode)!;
  // /d/{code}?depth=2 -> có mảng wards
  const data = await getJSON<{ wards: Ward[] }>(`${BASE}/d/${districtCode}?depth=2`);
  dCache.set(districtCode, data.wards);
  return data.wards;
}
