// src/components/CategoryGrid.tsx
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

export default function CategoryGrid({
  title = 'Danh mục',
  className = '',
  skeletonCount = 8,
}: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:3000/categories', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        const json = await res.json();
        const data = json?.data || [];

        const parents = data.filter((it: any) => !it.parent_id);

        const toImageUrl = (url?: string) => {
          if (!url) return 'https://via.placeholder.com/43x43?text=%3F';
          if (url.startsWith('http')) return url;
          return `http://localhost:3000${url}`;
        };

        const mapped: Category[] = parents.map((it: any) => ({
          id: it.id,
          name: it.name,
          slug: it.slug || String(it.id),
          iconUrl: toImageUrl(it.image),
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

  return (
    <section
      className={`rounded-2xl bg-white ring-1 ring-slate-200 shadow-xl p-4 ${className}`}
    >
      <ul className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-6 gap-y-6">
        {loading &&
          Array.from({ length: skeletonCount }).map((_, i) => (
            <li key={i} className="flex justify-center animate-pulse">
              <div className="flex flex-col items-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
                <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
              </div>
            </li>
          ))}

        {!loading &&
          categories.map((c) => (
            <li key={c.id} className="flex justify-center">
              <button
                onClick={() =>
                  navigate(`/category/${c.slug}`, { state: { title: c.name } })
                }
                className="group flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-xl"
                aria-label={c.name}
              >
                <div className="h-14 w-14 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                  <img
                    src={c.iconUrl}
                    alt={c.name}
                    className="h-9 w-9 object-contain"
                    
                  />
                </div>
                <span className="mt-2 max-w-[9rem] text-center text-base text-slate-800 truncate font-medium group-hover:text-sky-700">
                  {c.name}
                </span>
              </button>
            </li>
          ))}

        {!loading && !categories.length && !error && (
          <li className="px-2 py-3 text-xs text-slate-500">Chưa có danh mục</li>
        )}

        {error && <li className="px-2 py-3 text-xs text-red-600">{error}</li>}
      </ul>
    </section>
  );
}
