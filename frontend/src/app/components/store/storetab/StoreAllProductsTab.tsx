import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import StoreCategorySidebar, { StoreCategory } from '../StoreCategorySidebar';
import StoreProductsGrid from '../StoreProductsGrid';

export default function StoreAllProductsTab() {
  const { slug = '' } = useParams<{ slug: string }>();
  const { search, pathname } = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(search);
  const categorySlug = params.get('category');

  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${BE_BASE_URL}/stores/slug/${slug}/categories`
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (alive) setCategories(json.data ?? []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [slug]);

  const selectCategory = (newSlug: string | null) => {
    const p = new URLSearchParams();

    if (newSlug) {
      p.set('category', newSlug);
    }

    const query = p.toString();
    navigate(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <div className="grid grid-cols-1 gap-1 lg:grid-cols-[260px_1fr]">
      {/* Sidebar danh mục */}
      <div className="hidden lg:block">
        <StoreCategorySidebar
          items={categories}
          selectedSlug={categorySlug}
          onSelect={selectCategory}
          className="sticky top-20"
          title="Danh mục sản phẩm"
        />
        {loading && (
          <div className="text-sm text-slate-500 mt-2">Đang tải...</div>
        )}
      </div>

      {/* Grid sản phẩm */}
      <StoreProductsGrid storeSlug={slug} categorySlug={categorySlug} />
    </div>
  );
}
