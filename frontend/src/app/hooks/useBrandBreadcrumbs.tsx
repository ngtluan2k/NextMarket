// src/app/hooks/useBrandBreadcrumbs.ts
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Crumb } from '../components/Breadcrumb';

interface Brand {
  id: number;
  name: string;
}

export const useBrandBreadcrumbs = (brand?: Brand): Crumb[] => {
  const { brandId } = useParams<{ brandId: string }>();

  return useMemo<Crumb[]>(() => {
    const crumbs: Crumb[] = [];

    if (brand) {
      crumbs.push({ label: brand.name, href: `/brands/${brand.id}` });
    } else if (brandId) {
      // TODO: nếu chưa có brand, chỗ này bạn nên fetch brand theo id để lấy name
      crumbs.push({ label: `Brand ${brandId}`, href: `/brands/${brandId}` });
    }

    return crumbs;
  }, [brand, brandId]);
};
