import React, { useEffect, useState } from "react";

export type Shortcut = { id: string | number; title: string; iconUrl: string; href?: string };

type Props = {
  items?: Shortcut[];
  apiUrl?: string;
  dataPath?: string;
  idKey?: string;
  titleKey?: string;
  iconKey?: string;
  hrefKey?: string;
  className?: string;
  skeletonCount?: number;
};

function getByPath(obj: any, path?: string) {
  if (!path) return obj;
  return path.split(".").reduce((acc, k) => acc?.[k], obj);
}

export default function PromoShortcuts({
  items: itemsProp,
  apiUrl,
  dataPath,
  idKey = "id",
  titleKey = "title",
  iconKey = "iconUrl",
  hrefKey = "href",
  className = "",
  skeletonCount = 8,
}: Props) {
  const [items, setItems] = useState<Shortcut[] | undefined>(itemsProp);
  const [loading, setLoading] = useState<boolean>(!!apiUrl);

  useEffect(() => setItems(itemsProp), [itemsProp]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!apiUrl) return;
      try {
        setLoading(true);
        const r = await fetch(apiUrl);
        const json = await r.json();
        const raw = getByPath(json, dataPath);
        const arr: any[] = Array.isArray(raw) ? raw : raw?.items || raw?.data || json?.items || json?.data || [];
        const mapped: Shortcut[] = (arr || []).map((it: any) => ({
          id: it?.[idKey] ?? it?.id,
          title: it?.[titleKey] ?? it?.title,
          iconUrl: it?.[iconKey] ?? it?.iconUrl ?? it?.icon ?? it?.image,
          href: it?.[hrefKey] ?? it?.href ?? it?.link,
        }));
        if (!cancelled) setItems(mapped);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, dataPath, idKey, titleKey, iconKey, hrefKey]);

  return (
    <section className={`rounded-2xl bg-white ring-1 ring-slate-200 shadow-xl ${className}`}>
      <ul className="px-3 py-3 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-x-8 gap-y-6">
        {(!items || loading) &&
          Array.from({ length: skeletonCount }).map((_, i) => (
            <li key={`sk-${i}`} className="flex justify-center animate-pulse">
              <div className="flex flex-col items-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 ring-1 ring-slate-200" />
                <div className="mt-2 h-3 w-20 rounded bg-slate-100" />
              </div>
            </li>
          ))}

        {items?.map((it) => (
          <li key={it.id} className="flex justify-center">
            <a
              href={it.href || "#"}
              className="group flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-xl"
              aria-label={it.title}
            >
              <div className="h-14 w-14 rounded-2xl bg-slate-50 ring-1 ring-slate-200 flex items-center justify-center shadow group-hover:scale-105 transition-transform">
                <img
                  src={it.iconUrl}
                  alt=""
                  className="h-9 w-9 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "https://via.placeholder.com/36?text=%E2%9C%93";
                  }}
                />
              </div>
              <span className="mt-2 max-w-[9rem] text-center text-xs text-slate-800 truncate">{it.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
