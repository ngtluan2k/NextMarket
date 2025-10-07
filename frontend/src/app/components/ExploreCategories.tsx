import React, { useEffect, useMemo, useState } from 'react';

export type ExploreItem = {
  id: string | number;
  name: string;
  href?: string;
  to?: string;
};

type Props = {
  title?: string;
  items?: ExploreItem[];
  fetchItems?: () => Promise<ExploreItem[]>;
  onSelect?: (item: ExploreItem) => void;
  selectedIds?: number[];
  className?: string;
};

export default function ExploreCategories({
  title = 'Khám phá',
  items,
  fetchItems,
  onSelect,
  selectedIds = [],
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
      <div className="pt-2 pb-4 px-4">
        <h3 className="text-sm md:text-base font-medium text-slate-900 mb-2 text-left">
          {title}
        </h3>

        <ul className="flex flex-wrap gap-2">
          {loading && shown.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <li
                  key={i}
                  className="px-3 py-1 rounded-full bg-slate-200 animate-pulse"
                />
              ))
            : shown.map((c) => {
                const isSelected = selectedIds.includes(Number(c.id));
                return (
                  <li
                    key={c.id}
                    className={`px-3 py-1 rounded-full cursor-pointer border-2 ${
                      isSelected
                        ? 'border-[#0a68ff] bg-blue-50'
                        : 'border-slate-300'
                    }`}
                    onClick={() => onSelect?.(c)}
                  >
                    <span
                      className={`text ${
                        isSelected ? 'text-[#0a68ff]' : 'text-slate-800'
                      }`}
                    >
                      {c.name}
                    </span>
                  </li>
                );
              })}
        </ul>
      </div>
    </section>
  );
}
