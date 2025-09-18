import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

export type StoreInfo = {
  id: string | number;
  name: string;
  avatarUrl?: string | null;
  isOfficial?: boolean;
  rating?: number | null;     // 0..5
  followers?: number | null;  // số người theo dõi
};

export type StoreTopBarProps = {
  storeSlug: string;
  basePath?: string;
  tabs?: { key: string; label: string; href?: string }[];
  fetchStore?: (slug: string) => Promise<StoreInfo>;
  onSearch?: (query: string) => void;
  showSearch?: boolean;
  sticky?: boolean;          
  className?: string;
};

export default function StoreTopBar({
  storeSlug,
  basePath,
  tabs,
  fetchStore,
  onSearch,
  showSearch = true,
  sticky = false,             
  className,
}: StoreTopBarProps) {
  const [info, setInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const { pathname } = useLocation();
  const formRef = useRef<HTMLFormElement>(null);

  const computedBase = basePath ?? `/store/${storeSlug}`;
  const computedTabs = useMemo(() => {
    if (tabs?.length) {
      return tabs.map(t => ({ ...t, href: t.href ?? `${computedBase}${t.key === "home" ? "" : `/${t.key}`}` }));
    }
    return [
      { key: "home",        label: "Cửa Hàng",        href: `${computedBase}` },
      { key: "all",         label: "Tất Cả Sản Phẩm", href: `${computedBase}/all` },
      { key: "collections", label: "Bộ Sưu Tập",      href: `${computedBase}/collections` },
      { key: "deals",       label: "Giá Sốc Hôm Nay", href: `${computedBase}/deals` },
      { key: "profile",     label: "Hồ Sơ Cửa Hàng",   href: `${computedBase}/profile` },
    ];
  }, [tabs, computedBase]);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setErr(null);
      try {
        const data = await (fetchStore ? fetchStore(storeSlug) : defaultFetchStore(storeSlug));
        if (alive) setInfo(data);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Load store failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [storeSlug, fetchStore]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSearch?.(q.trim()); };

  return (
    <header
      className={[
        sticky ? "sticky top-0 z-40" : "",
        className ?? "",
      ].join(" ")}
    >
      <div className="mx-auto mt-3 max-w-[1300px] px-4 sm:px-6">
        <div className="overflow-hidden  bg-[#143e82] text-white shadow-sm">
          <div className="px-4 py-2.5 sm:px-6">
            <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_auto]">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-11 w-11 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/25 sm:h-12 sm:w-12">
                  {info?.avatarUrl ? (
                    <img src={info.avatarUrl} alt={info?.name ?? "store"} className="h-full w-full object-cover" />
                  ) : (
                    <div className={`h-full w-full ${loading ? "animate-pulse bg-white/10" : ""}`} />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold sm:text-base">
                      {loading ? <span className="inline-block h-4 w-40 animate-pulse rounded bg-white/20" /> : info?.name}
                    </div>
                    {!!info?.isOfficial && (
                      <span className="rounded border border-white/25 bg-white/10 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide">
                        Official
                      </span>
                    )}
                  </div>

                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-white/85">
                    {typeof info?.rating === "number"
                      ? <span>⭐ {info.rating.toFixed(1)} / 5</span>
                      : loading ? <span className="inline-block h-3 w-20 animate-pulse rounded bg-white/10" /> : null}
                    {typeof info?.followers === "number"
                      ? <span>• {new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(info.followers)} người theo dõi</span>
                      : loading ? <span className="inline-block h-3 w-24 animate-pulse rounded bg-white/10" /> : null}

                  </div>
                </div>
              </div>

              {/* follow */}
              <button
                type="button"
                className="hidden shrink-0 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold backdrop-blur transition hover:bg-white/20 sm:block"
              >
                + Theo Dõi
              </button>

              {/* search */}
              {showSearch && (
                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className="ml-auto hidden w-full max-w-[520px] items-center rounded-lg bg-white pl-3 pr-1 text-slate-900 sm:flex"
                >
                  <span className="mr-1 text-slate-500">🔎</span>
                  <input
                    type="search"
                    placeholder="Tìm sản phẩm tại cửa hàng"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400"
                  />
                  <button type="submit" className="rounded-md bg-[#0a5bd7] px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110">
                    Tìm
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Row 2: Tabs (nằm trong mảng xanh) */}
          <nav className="border-t border-white/15">
            <ul className="no-scrollbar mx-auto flex max-w-[1200px] gap-6 overflow-x-auto px-4 py-1.5 sm:px-6">
              {computedTabs.map(t => (
                <li key={t.href}>
                  <Link
                    to={t.href!}
                    className={[
                      "relative block px-1.5 py-2 text-sm transition",
                      isActive(t.href!) ? "font-semibold text-white" : "text-white/85 hover:text-white"
                    ].join(" ")}
                    aria-current={isActive(t.href!) ? "page" : undefined}
                  >
                    {t.label}
                    <span className={[
                      "absolute left-0 right-0 -bottom-0.5 mx-auto h-0.5 rounded",
                      isActive(t.href!) ? "bg-white" : "bg-transparent"
                    ].join(" ")} />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

/** Mặc định gọi /api/stores/:slug */
async function defaultFetchStore(slug: string): Promise<StoreInfo> {
  const res = await fetch(`/api/stores/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
