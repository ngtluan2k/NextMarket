import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

export type ExploreItem = {
  id: string | number;
  name: string;
  imageUrl: string;
  href?: string;
  to?: string;
};

type Props = {
  title?: string;
  items?: ExploreItem[];
  fetchItems?: () => Promise<ExploreItem[]>;
  onSelect?: (item: ExploreItem) => void;
  className?: string;
};

const ph = (size = 96) =>
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>
       <rect width='100%' height='100%' rx='999' fill='#F1F5F9'/>
       <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
             font-family='system-ui,Segoe UI,Roboto' font-size='12' fill='#94A3B8'>No image</text>
     </svg>`
  );

export default function ExploreCategories({
  title = 'Khám phá theo danh mục',
  items,
  fetchItems,
  onSelect,
  className = '',
}: Props) {
  const [list, setList] = useState<ExploreItem[]>(items ?? []);
  const [loading, setLoading] = useState<boolean>(!!fetchItems);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!fetchItems) return;
      try {
        setLoading(true);
        const data = await fetchItems();
        if (!cancelled && Array.isArray(data)) setList(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchItems]);

  const shown = useMemo(() => (list?.length ? list : []), [list]);

  return (
    <section
      className={`rounded-2xl bg-white ring-1 ring-slate-200 shadow ${className}`}
    >
      {/* chỉ padding ở lớp nội dung */}
      <div className="px-5 pt-2 pb-4">
        <h3 className="text-[18px] md:text-[19px] font-semibold leading-tight text-slate-900 mb-2">
          {title}
        </h3>

        {/* 1 hàng – 4 cột (mobile 2 cột) */}
        <ul className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-y-8">
          {loading && shown.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="flex flex-col items-center">
                  <div className="h-24 w-24 rounded-full bg-slate-100 animate-pulse" />
                  <div className="mt-2 h-3 w-24 rounded bg-slate-100 animate-pulse" />
                </li>
              ))
            : shown.map((c) => {
                const body = (
                  <>
                    <div className="h-24 w-24 rounded-full border border-slate-200 bg-slate-50 overflow-hidden grid place-items-center">
                      <img
                        src={c.imageUrl || ph(96)}
                        alt={c.name}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = ph(96);
                        }}
                      />
                    </div>
                    <div className="mt-2 text-center text-sm font-medium text-slate-800">
                      {c.name}
                    </div>
                  </>
                );

                return (
                  <li key={c.id} className="flex flex-col items-center">
                    {c.to ? (
                      <Link
                        to={c.to}
                        className="group flex flex-col items-center hover:text-sky-700"
                        onClick={() => onSelect?.(c)}
                      >
                        {body}
                      </Link>
                    ) : c.href ? (
                      <a
                        href={c.href}
                        className="group flex flex-col items-center hover:text-sky-700"
                        onClick={() => onSelect?.(c)}
                      >
                        {body}
                      </a>
                    ) : (
                      <button
                        className="group flex flex-col items-center hover:text-sky-700"
                        onClick={() => onSelect?.(c)}
                      >
                        {body}
                      </button>
                    )}
                  </li>
                );
              })}
        </ul>
      </div>
    </section>
  );
}
