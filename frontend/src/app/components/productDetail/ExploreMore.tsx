import React, { useEffect, useMemo, useState } from 'react';
import { Star, Flame, Sparkles } from 'lucide-react';

export type ExploreSectionKey = 'forYou' | 'trending';

export type ExploreItem = {
  id: string | number;
  name: string;
  imageUrl: string;
  price: number;
  originalPrice?: number;
  rating?: number;
  reviewCount?: number;
  sellerBadge?: 'Official' | 'XTRA' | 'TOP' | 'Mall' | string;
  isAd?: boolean;
  shipNote?: string;
  link?: string;
};

export type ExploreHero = {
  imageUrl: string;
  title?: string;
  link?: string;
  subTitle?: string;
};

export default function ExploreMore({
  sections = [
    {
      key: 'forYou' as ExploreSectionKey,
      title: 'Dành cho bạn',
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      key: 'trending' as ExploreSectionKey,
      title: 'Trending',
      icon: <Flame className="h-4 w-4" />,
    },
  ],
  fetchItems,
  hero,
  initial = 'forYou',
}: {
  sections?: {
    key: ExploreSectionKey;
    title: string;
    icon?: React.ReactNode;
  }[];
  fetchItems?: (key: ExploreSectionKey) => Promise<ExploreItem[]>;
  hero?: ExploreHero;
  initial?: ExploreSectionKey;
}) {
  const [tab, setTab] = useState<ExploreSectionKey>(initial);
  const [data, setData] = useState<Record<string, ExploreItem[]>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let stop = false;
    const run = async () => {
      if (data[tab]) return;
      setLoading(true);
      try {
        const items = fetchItems ? await fetchItems(tab) : await mockFetch(tab);
        if (!stop) setData((d) => ({ ...d, [tab]: items }));
      } finally {
        if (!stop) setLoading(false);
      }
    };
    run();
    return () => {
      stop = true;
    };
  }, [tab]);

  const items = data[tab] ?? [];

  return (
    <section className="rounded-xl sm:rounded-2xl bg-white p-3 sm:p-4 ring-1 ring-slate-200">
      {/* Tabs - Responsive */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 px-1 overflow-x-auto">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setTab(s.key)}
            className={`relative -mb-px inline-flex items-center gap-1 sm:gap-1.5 rounded-t-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0
              ${
                tab === s.key
                  ? 'text-sky-700'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
          >
            {s.icon}
            {s.title}
            {tab === s.key && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-sky-600" />
            )}
          </button>
        ))}
      </div>

      {/* Grid - Responsive */}
      <div className="mt-3 grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
        {/* Hero banner - Hidden on mobile */}
        {hero && (
          <a
            href={hero.link ?? '#'}
            className="relative col-span-2 row-span-2 hidden lg:block overflow-hidden rounded-xl ring-1 ring-slate-200"
          >
            <img
              src={hero.imageUrl}
              alt={hero.title ?? ''}
              className="h-full w-full object-cover"
            />
            {(hero.title || hero.subTitle) && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 text-white">
                {hero.title && (
                  <div className="text-base font-semibold">{hero.title}</div>
                )}
                {hero.subTitle && (
                  <div className="text-xs opacity-90">{hero.subTitle}</div>
                )}
              </div>
            )}
          </a>
        )}

        {/* Skeleton while loading */}
        {loading &&
          Array.from({ length: hero ? 10 : 12 }).map((_, i) => (
            <div key={i} className="rounded-lg sm:rounded-xl ring-1 ring-slate-200 p-2">
              <div className="aspect-[4/5] w-full rounded-md bg-slate-100 animate-pulse" />
              <div className="mt-2 h-3 w-3/4 rounded bg-slate-100 animate-pulse" />
              <div className="mt-1 h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
            </div>
          ))}

        {/* Items */}
        {!loading && items.map((it) => <Card key={it.id} item={it} />)}
      </div>
    </section>
  );
}

/* ---------- Card ---------- */
const vnd = (n?: number) =>
  (n ?? 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

function Card({ item }: { item: ExploreItem }) {
  const discount =
    item.originalPrice && item.originalPrice > item.price
      ? Math.round(100 - (item.price / item.originalPrice) * 100)
      : undefined;

  return (
    <a
      href={item.link ?? '#'}
      className="group rounded-lg sm:rounded-xl ring-1 ring-slate-200 p-2 hover:shadow-sm transition-shadow"
    >
      <div className="relative">
        {item.isAd && (
          <span className="absolute left-1 top-1 sm:left-2 sm:top-2 rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            AD
          </span>
        )}
        {item.sellerBadge && (
          <span className="absolute right-1 top-1 sm:right-2 sm:top-2 rounded bg-sky-600/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {item.sellerBadge}
          </span>
        )}
        <div className="aspect-[4/5] overflow-hidden rounded-md bg-slate-50">
          <img
            src={item.imageUrl}
            alt=""
            className="h-full w-full object-cover transition-transform group-hover:scale-[1.02]"
          />
        </div>
      </div>

      <div className="mt-2 line-clamp-2 text-xs sm:text-sm text-slate-800 leading-tight">
        {item.name}
      </div>

      <div className="mt-1 flex items-center gap-1 text-[10px] sm:text-[11px] text-amber-500">
        <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-current" />
        <span className="text-slate-700">{(item.rating ?? 0).toFixed(1)}</span>
        {item.reviewCount ? (
          <span className="text-slate-500">({item.reviewCount})</span>
        ) : null}
      </div>

      <div className="mt-1 flex items-baseline gap-2">
        <div className="text-sm sm:text-base font-semibold text-rose-600">
          {vnd(item.price)}
        </div>
        {item.originalPrice && item.originalPrice > item.price && (
          <div className="text-xs text-slate-400 line-through">
            {vnd(item.originalPrice)}
          </div>
        )}
        {typeof discount === 'number' && (
          <div className="ml-auto rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600">
            -{discount}%
          </div>
        )}
      </div>

      {item.shipNote && (
        <div className="mt-1 text-[10px] sm:text-[11px] text-slate-500">{item.shipNote}</div>
      )}
    </a>
  );
}

/* ---------- Mock fetch ---------- */
async function mockFetch(key: ExploreSectionKey): Promise<ExploreItem[]> {
  await new Promise((r) => setTimeout(r, 250));
  const base: ExploreItem[] = Array.from({ length: 12 }).map((_, i) => ({
    id: `${key}-${i}`,
    name: `Chuột không dây Logitech M33${i} Silent`,
    imageUrl: `https://picsum.photos/seed/m${key}${i}/400/500`,
    price: 319000 + i * 5000,
    originalPrice: i % 3 === 0 ? 450000 : undefined,
    rating: 4 + (i % 5) * 0.1,
    reviewCount: 20 + i,
    sellerBadge: i % 4 === 0 ? 'Official' : i % 5 === 0 ? 'XTRA' : undefined,
    isAd: i % 7 === 0,
    shipNote: 'Giao Thứ 7, 20/09',
    link: '#',
  }));
  return base;
}