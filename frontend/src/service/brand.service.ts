// src/service/brand.service.ts
import { BrandCard } from '../app/components/FeaturedBrands';

export const fetchBrandsAPI = async (): Promise<BrandCard[]> => {
  const res = await fetch('http://localhost:3000/brands', {});
  const json = await res.json();
  const data = json?.data || [];

  return data.map((b: any) => ({
    id: b.id,
    coverUrl: b.logo_url || '', // dùng logo_url làm cover
    title: b.description,
    tagline: b.tagline,
    href: b.href,
  }));
};
