// src/app/components/ExploreBrands.tsx
import React, { useEffect, useState } from 'react';

export interface ExploreBrand {
  id: number | string;
  name: string;
  logo_url?: string;
}

interface Props {
  title?: string;
  fetchItems: () => Promise<ExploreBrand[]>;
  onSelect?: (item: ExploreBrand) => void;
  selectedIds?: (string | number)[];
}

const ExploreBrands: React.FC<Props> = ({
  title,
  fetchItems,
  onSelect,
  selectedIds = [],
}) => {
  const [items, setItems] = useState<ExploreBrand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchItems();
        if (!cancelled) setItems(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchItems]);

  return (
    <section className={`rounded-2xl bg-white ring-1 ring-slate-200 shadow`}>
      <div className="pt-2 pb-4 px-4">
        {title && (
          <h3 className="text-sm md:text-base font-medium text-slate-900 mb-2 text-left">
            {title}
          </h3>
        )}

        <ul className="flex flex-wrap gap-2">
          {loading && items.length === 0
            ? Array.from({ length: 4 }).map((_, i) => (
                <li
                  key={i}
                  className="px-3 py-1 rounded-full bg-slate-200 animate-pulse"
                />
              ))
            : items.map((item) => {
                const isSelected = selectedIds.includes(Number(item.id));
                return (
                  <li
                    key={item.id}
                    className={`px-3 py-1 rounded-full cursor-pointer border-2 flex items-center gap-2 ${
                      isSelected
                        ? 'border-[#0a68ff] bg-blue-50 text-[#0a68ff]'
                        : 'border-slate-300 text-slate-800'
                    }`}
                    onClick={() => onSelect?.(item)}
                  >
                    {item.logo_url && (
                      <img
                        src={item.logo_url}
                        alt={item.name}
                        className="h-5 w-5 object-contain rounded-full"
                        onError={(e) => {
                          (
                            e.currentTarget as HTMLImageElement
                          ).style.visibility = 'hidden';
                        }}
                      />
                    )}
                    <span>{item.name}</span>
                  </li>
                );
              })}
        </ul>
      </div>
    </section>
  );
};

export default ExploreBrands;
