// src/components/CategoryNav.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export type Category = {
  id: string | number;
  name: string;
  slug?: string;
  iconUrl: string;
};

type Props = {
  title?: string;
  className?: string;
  skeletonCount?: number;
};

export default function CategoryNav({
  title = 'Danh mục',
  className = '',
  skeletonCount = 12,
}: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

 useEffect(() => {
  let cancelled = false;

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:3000/categories', {
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);

      const json = await res.json();
      const data = json?.data || [];

      // Lọc chỉ lấy category cha
      const parents = data.filter((it: any) => !it.parent_id);

      const mapped: Category[] = parents.map((it: any) => ({
        id: it.id,
        name: it.name,
        slug: it.slug || String(it.id), // ưu tiên slug, fallback id
        iconUrl: it.image || 'https://via.placeholder.com/43x43?text=%3F',
      }));

      if (!cancelled) setCategories(mapped);
    } catch (e: any) {
      if (!cancelled) setError(e.message || 'Không tải được danh mục');
    } finally {
      if (!cancelled) setLoading(false);
    }
  };

  fetchCategories();
  return () => {
    cancelled = true;
  };
}, []);


  const hasData = categories.length > 0;

  return (
    <nav
      className={`w-full rounded-2xl bg-white ring-1 ring-slate-200 shadow ${className}`}
      aria-label="Danh mục"
    >
      <div className="px-4 pt-3 pb-2 text-base font-bold text-slate-900">
        {title}
      </div>

      <div className="px-2 pb-2 max-h-[715px] overflow-y-auto no-scrollbar">
        {error && (
          <div className="m-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </div>
        )}

        <ul className="flex flex-col gap-2">
          {loading &&
            Array.from({ length: skeletonCount }).map((_, i) => (
              <li key={`sk-${i}`} className="animate-pulse">
                <div className="grid grid-cols-[44px_1fr] items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 bg-white">
                  <div className="h-[43px] w-[43px] rounded-md bg-slate-100" />
                  <div className="h-3 w-36 rounded bg-slate-100" />
                </div>
              </li>
            ))}

          {hasData &&
            categories.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => {
                    setActiveId(c.id);
                    navigate(`/category/${c.slug}`, {
                      state: { title: c.name },
                    });
                  }}
                  className={`group grid w-full grid-cols-[44px_1fr] items-center gap-2 rounded-lg border shadow-sm px-2 py-1.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white ${
                    activeId === c.id
                      ? 'border-slate-500'
                      : 'border-slate-300 hover:border-slate-400 hover:bg-stone-100'
                  }`}
                  aria-current={activeId === c.id ? 'true' : undefined}
                >
                  <img
                    src={c.iconUrl}
                    alt={c.name}
                    className="h-[35px] w-[35px] rounded-md object-cover"
                  />
                  <span className="text-base leading-snug text-slate-900">
                    {c.name}
                  </span>
                </button>
              </li>
            ))}

          {!loading && !hasData && !error && (
            <li className="px-2 py-3 text-xs text-slate-500">
              Chưa có danh mục.
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
