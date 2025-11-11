import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BE_BASE_URL } from '../../api/api';
import { storeService } from '../../../service/store.service';
import { StarFilled } from '@ant-design/icons';

export type StoreInfo = {
  id: string | number;
  name: string;
  logo_url?: string | null;
  isOfficial?: boolean;
  avg_rating?: number | null;
  review_count?: number | null;
  followers?: number | null;
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

const IconSearch = ({ className = 'h-5 w-5 text-slate-700' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

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
  const [q, setQ] = useState('');
  const { pathname } = useLocation();
  const formRef = useRef<HTMLFormElement>(null);
  const [following, setFollowing] = useState<boolean>(false);
  const [followers, setFollowers] = useState<number | null>(null);
  const computedBase = basePath ?? `/stores/slug/${storeSlug}`;
  const computedTabs = useMemo(() => {
    if (tabs?.length) {
      return tabs.map((t) => ({
        ...t,
        href: t.href ?? `${computedBase}${t.key === 'home' ? '' : `/${t.key}`}`,
      }));
    }
    return [
      { key: 'home', label: 'Cửa Hàng', href: `${computedBase}` },
      { key: 'all', label: 'Tất Cả Sản Phẩm', href: `${computedBase}/all` },
      {
        key: 'collections',
        label: 'Bộ Sưu Tập',
        href: `${computedBase}/collections`,
      },
      { key: 'deals', label: 'Giá Sốc Hôm Nay', href: `${computedBase}/deals` },
      {
        key: 'profile',
        label: 'Hồ Sơ Cửa Hàng',
        href: `${computedBase}/profile`,
      },
    ];
  }, [tabs, computedBase]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!info?.id) return;
      try {
        const [{ followed }, { count }] = await Promise.all([
          storeService
            .isFollowing(Number(info.id))
            .catch(() => ({ followed: false })),
          storeService
            .followersCount(Number(info.id))
            .catch(() => ({ count: info?.followers ?? 0 })),
        ]);
        if (alive) {
          setFollowing(!!followed);
          setFollowers(
            typeof count === 'number' ? count : info?.followers ?? 0
          );
        }
      } catch (error) {
        console.error(error);
      }
    })();
    return () => {
      alive = false;
    };
  }, [info?.id]);

  const handleToggleFollow = async () => {
    if (!info?.id) return;
    try {
      const { followed } = await storeService.toggleFollow(Number(info.id));
      setFollowing(!!followed);
      setFollowers((prev) => {
        const base = typeof prev === 'number' ? prev : info?.followers ?? 0;
        return followed ? base + 1 : Math.max(base - 1, 0);
      });
    } catch (e) {
      // có thể hiện message lỗi nếu muốn
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await (fetchStore
          ? fetchStore(storeSlug)
          : defaultFetchStore(storeSlug));
        if (alive) setInfo(data);
      } catch (e: any) {
        if (alive) setErr(e?.message || 'Load store failed');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [storeSlug, fetchStore]);

  const clean = (s: string) => s.replace(/\/+$/, '');
  const path = clean(pathname);
  const isActiveTab = (t: { key: string; href?: string }) => {
    const href = clean(t.href || '');
    if (t.key === 'home') return path === href;
    return path === href || path.startsWith(href + '/');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(q.trim());
  };

  const rating = parseFloat(info?.avg_rating as any) || 0;
  const reviews = parseInt(info?.review_count as any) || 0;

  return (
    <header
      className={[sticky ? 'sticky top-0 z-40' : '', className ?? ''].join(' ')}
    >
      <div className="mx-auto mt-3 max-w-[1300px] px-4 sm:px-6">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="px-4 py-3 sm:px-6">
            <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[1fr_auto_auto]">
              {/* Avatar + Info */}
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full ring-1 ring-slate-200 bg-slate-50">
                  {info?.logo_url ? (
                    <img
                      src={info.logo_url}
                      alt={info?.name ?? 'store'}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className={`h-full w-full ${
                        loading ? 'animate-pulse bg-slate-100' : ''
                      }`}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-base font-semibold text-slate-900">
                      {loading ? (
                        <span className="inline-block h-4 w-40 animate-pulse rounded bg-slate-200" />
                      ) : (
                        info?.name
                      )}
                    </div>
                    {!!info?.isOfficial && (
                      <span className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-blue-700">
                        Official
                      </span>
                    )}
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-600">
                      <span>{rating.toFixed(1)}</span>
                      <StarFilled className="text-yellow-400 h-3 w-3" />
                      <span>({reviews})</span>
                    </div>
                  </div>

                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    {typeof followers === 'number' ? (
                      <span>
                        •{' '}
                        {new Intl.NumberFormat('vi-VN', {
                          notation: 'compact',
                        }).format(followers)}{' '}
                        người theo dõi
                      </span>
                    ) : loading ? (
                      <span className="inline-block h-3 w-24 animate-pulse rounded bg-slate-100" />
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleToggleFollow}
                className={[
                  'hidden shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition sm:block',
                  following
                    ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
                    : 'bg-blue-600 text-white hover:bg-blue-700',
                ].join(' ')}
              >
                {following ? 'Đang Theo Dõi' : '+ Theo Dõi'}
              </button>

              {showSearch && (
                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className="ml-auto hidden w-full max-w-[520px] items-center rounded-lg border border-slate-200 bg-slate-50 pl-3 pr-1 text-slate-900 sm:flex"
                >
                  <IconSearch className="mr-1 shrink-0 h-5 w-5 text-slate-700" />
                  <input
                    type="search"
                    placeholder="Tìm sản phẩm tại cửa hàng"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="w-full bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Tìm
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Tabs */}
          <nav className="border-t border-slate-200 bg-white">
            <ul className="no-scrollbar mx-auto flex max-w-[1300px] gap-6 overflow-x-auto px-4 py-2 sm:px-6">
              {computedTabs.map((t) => (
                <li key={t.href}>
                  <Link
                    to={t.href!}
                    className={[
                      'relative block px-1.5 py-2 text-sm transition',
                      isActiveTab(t)
                        ? 'font-semibold text-slate-900'
                        : 'text-slate-600 hover:text-slate-900',
                    ].join(' ')}
                    aria-current={isActiveTab(t) ? 'page' : undefined}
                  >
                    {t.label}
                    <span
                      className={[
                        'absolute left-0 right-0 -bottom-0.5 mx-auto h-0.5 rounded',
                        isActiveTab(t) ? 'bg-blue-600' : 'bg-transparent',
                      ].join(' ')}
                    />
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

function toAbs(p?: string) {
  if (!p) return '';
  let s = p.trim();

  if (/^data:/i.test(s)) return s;
  if (/^https?:\/\//i.test(s)) return s;
  s = s.replace(/\\/g, '/');
  if (/^[a-zA-Z]:\//.test(s) || s.startsWith('file:/')) {
    const idx = s.toLowerCase().lastIndexOf('/uploads/');
    if (idx >= 0) s = s.slice(idx + 1);
  }
  return `${BE_BASE_URL}/${s.replace(/^\/+/, '')}`;
}

async function defaultFetchStore(slug: string): Promise<StoreInfo> {
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;
  const res = await fetch(`${BE_BASE_URL}/stores/slug/${slug}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return {
    id: json.data.id,
    name: json.data.name,
    logo_url: json.data.logo_url ? toAbs(json.data.logo_url) : null,
    isOfficial: json.data.isOfficial,
    avg_rating: json.data.avg_rating ?? 0,
    review_count: json.data.review_count ?? 0,
    followers: json.data.followers?.length ?? 0,
  };
}
