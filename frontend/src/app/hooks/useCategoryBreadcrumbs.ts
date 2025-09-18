// src/hooks/useCategoryBreadcrumbs.ts
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { getCategoryBySlug } from '../../service/category.service';
// Bạn sẽ viết service thật ở đây

export function useCategoryBreadcrumbs() {
  const { slug } = useParams<{ slug: string }>();
  const { pathname } = useLocation();
  const isExplore = pathname.endsWith('/explore'); // /category/:slug/explore

  const [catName, setCatName] = useState<string>(''); // rỗng trước

  useEffect(() => {
    let cancelled = false;
    if (!slug) {
      setCatName('');
      return;
    }
    (async () => {
      try {
        const data = await getCategoryBySlug(slug); // { id, name, ... }
        if (!cancelled) setCatName(data?.name ?? '');
      } catch {
        if (!cancelled) setCatName(''); // giữ rỗng nếu lỗi
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  // trả mảng crumbs (rỗng/placeholder trước; khi có name => re-render)
  return useMemo(() => {
    const base = [
      {
        label: catName || 'Danh mục',
        to: `/category/${slug}`,
        current: !isExplore,
      },
    ];
    return isExplore
      ? [...base, { label: 'Khám phá danh mục', current: true }]
      : base;
  }, [catName, slug, isExplore]);
}
