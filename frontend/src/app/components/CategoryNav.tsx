import React, { useEffect, useMemo, useState } from "react";

export type Category = { id: string | number; name: string; iconUrl: string };

type Props = {
  title?: string;
  /** Truyền data có sẵn (tuỳ chọn) */
  items?: Category[];
  /** Hoặc truyền API endpoint (tuỳ chọn) */
  apiUrl?: string;
  /** Nếu mảng nằm sâu trong json: "data.items" hoặc "result.list" ... */
  dataPath?: string;
  /** Map key từ API về shape {id,name,iconUrl} */
  idKey?: string;     // mặc định "id"
  nameKey?: string;   // mặc định "name"
  iconKey?: string;   // mặc định "iconUrl"
  onSelect?: (c: Category) => void;
  className?: string;
  skeletonCount?: number;
};

function getByPath(obj: any, path?: string) {
  if (!path) return obj;
  return path.split(".").reduce((acc, k) => acc?.[k], obj);
}

export default function CategoryNav({
  title = "Danh mục",
  items: itemsProp,
  apiUrl,
  dataPath,
  idKey = "id",
  nameKey = "name",
  iconKey = "iconUrl",
  onSelect,
  className = "",
  skeletonCount = 12,
}: Props) {
  const [items, setItems] = useState<Category[] | undefined>(itemsProp);
  const [activeId, setActiveId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState<boolean>(!!apiUrl);
  const [error, setError] = useState<string | null>(null);

  // ưu tiên items từ prop
  useEffect(() => setItems(itemsProp), [itemsProp]);

  // tự fetch khi có apiUrl
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!apiUrl) return;
      try {
        setLoading(true);
        setError(null);
        const r = await fetch(apiUrl);
        const json = await r.json();
        const raw = getByPath(json, dataPath);
        const arr: any[] = Array.isArray(raw)
          ? raw
          : Array.isArray(json)
          ? json
          : raw?.items || raw?.data || raw?.results || json?.items || json?.data || json?.results || [];
        const mapped: Category[] = (arr || []).map((it: any) => ({
          id: it?.[idKey] ?? it?.id,
          name: it?.[nameKey] ?? it?.name,
          iconUrl: it?.[iconKey] ?? it?.iconUrl ?? it?.icon ?? it?.image,
        }));
        if (!cancelled) setItems(mapped);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? "Không tải được danh mục");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [apiUrl, dataPath, idKey, nameKey, iconKey]);

  const hasData = !!items && items.length > 0;

  return (
    <nav className={`w-full rounded-2xl bg-white ring-1 ring-slate-200 shadow ${className}`} aria-label="Danh mục">
      <div className="px-4 pt-3 pb-2 text-xs font-bold text-slate-900">{title}</div>

      <div className="px-2 pb-2 max-h-[715px] overflow-y-auto no-scrollbar">
        {error && (
          <div className="m-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>
        )}

        <ul className="flex flex-col gap-2">
          {(!hasData || loading) &&
            Array.from({ length: skeletonCount }).map((_, i) => (
              <li key={`sk-${i}`} className="animate-pulse">
                <div className="grid grid-cols-[44px_1fr] items-center gap-2 rounded-lg border border-slate-200 px-2 py-1.5 bg-white">
                  <div className="h-[43px] w-[43px] rounded-md bg-slate-100" />
                  <div className="h-3 w-36 rounded bg-slate-100" />
                </div>
              </li>
            ))}

          {hasData &&
            items!.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => {
                    setActiveId(c.id);
                    onSelect?.(c);
                  }}
                  className={`group grid w-full grid-cols-[44px_1fr] items-center gap-2 rounded-lg border shadow-sm px-2 py-1.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white ${
                    activeId === c.id ? "border-slate-500" : "border-slate-300 hover:border-slate-400 hover:bg-stone-100"
                  }`}
                  aria-current={activeId === c.id ? "true" : undefined}
                >
                  <img
                    src={c.iconUrl}
                    alt={c.name}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = "https://via.placeholder.com/43x43?text=%3F";
                    }}
                    className="h-[43px] w-[43px] rounded-md object-cover"
                  />
                  <span className="text-xs leading-snug text-slate-900">{c.name}</span>
                </button>
              </li>
            ))}

          {items && items.length === 0 && !loading && !error && (
            <li className="px-2 py-3 text-xs text-slate-500">Chưa có danh mục.</li>
          )}
        </ul>
      </div>
    </nav>
  );
}
