import React, { useMemo, useState } from 'react';
import {
  Star,
  StarHalf,
  Image as ImageIcon,
  MessageSquare,
  Share2,
  ThumbsUp,
  CheckCircle2,
} from 'lucide-react';

/* ===================== Types ===================== */
export type Review = {
  id: string | number;
  rating: number; // 1..5
  title?: string;
  body?: string;
  images?: string[];
  author?: { name?: string; avatarUrl?: string };
  variantText?: string; // ví dụ: "Màu: Đen"
  verifiedPurchase?: boolean; // Đã mua hàng
  createdAt?: string | number | Date;
  helpfulCount?: number;
  commentCount?: number;
};

export type ProductReviewsProps = {
  reviews?: Review[]; // dữ liệu từ API
  loading?: boolean; // hiển thị skeleton
  pageSize?: number; // số review hiển thị mỗi lần
  hasMore?: boolean; // nếu phân trang server
  onLoadMore?: () => void | Promise<void>;
  className?: string;
};

/* ===================== Helpers ===================== */
const formatViDateTime = (t?: string | number | Date) => {
  if (!t) return '';
  const d = new Date(t);
  if (Number.isNaN(+d)) return '';
  return d.toLocaleString('vi-VN');
};

const Stars = ({ value = 0, size = 16 }: { value?: number; size?: number }) => {
  const safe = Math.max(0, Math.min(5, value));
  const full = Math.floor(safe);
  const half = safe - full >= 0.5;
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500">
      {Array.from({ length: full }).map((_, i) => (
        <Star
          key={i}
          className="fill-current"
          style={{ width: size, height: size }}
        />
      ))}
      {half && (
        <StarHalf
          className="fill-current"
          style={{ width: size, height: size }}
        />
      )}
      {Array.from({ length: 5 - full - (half ? 1 : 0) }).map((_, i) => (
        <Star key={`e${i}`} style={{ width: size, height: size }} />
      ))}
    </span>
  );
};

const DistributionBar = ({
  count,
  total,
  label,
}: {
  count: number;
  total: number;
  label: string;
}) => {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <span className="w-10 text-right text-slate-600">{label}</span>
      <div className="h-2 flex-1 rounded bg-slate-100">
        <div
          className="h-2 rounded bg-amber-400"
          style={{ width: `${pct}%` }}
          aria-label={`${pct}%`}
        />
      </div>
      <span className="w-8 text-slate-500 tabular-nums">{pct}%</span>
    </div>
  );
};

const Chip = ({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className={`rounded-full border px-3 py-1.5 text-sm ${
      active
        ? 'border-sky-600 bg-sky-50 text-sky-700'
        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
    }`}
  >
    {children}
  </button>
);

/* ===================== Component ===================== */
export default function ProductReviews({
  reviews = [],
  loading,
  pageSize = 5,
  hasMore,
  onLoadMore,
  className = '',
}: ProductReviewsProps) {
  // filters
  const [withPhotos, setWithPhotos] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [starFilter, setStarFilter] = useState<number | undefined>(undefined);
  const [visible, setVisible] = useState(pageSize);

  const allImages = useMemo(
    () => reviews.flatMap((r) => r.images ?? []),
    [reviews]
  );

  const stats = useMemo(() => {
    const total = reviews.length;
    const buckets = [0, 0, 0, 0, 0, 0]; // index 1..5
    let sum = 0;
    for (const r of reviews) {
      const s = Math.max(1, Math.min(5, Math.round(r.rating || 0)));
      buckets[s] += 1;
      sum += r.rating || 0;
    }
    const avg = total ? +(sum / total).toFixed(1) : 0;
    return { total, buckets, avg };
  }, [reviews]);

  const filtered = useMemo(() => {
    let arr = reviews;
    if (withPhotos) arr = arr.filter((r) => (r.images?.length || 0) > 0);
    if (verifiedOnly) arr = arr.filter((r) => r.verifiedPurchase);
    if (starFilter)
      arr = arr.filter((r) => Math.round(r.rating) === starFilter);
    // mặc định "Mới nhất"
    arr = [...arr].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
    );
    return arr;
  }, [reviews, withPhotos, verifiedOnly, starFilter]);

  const list = filtered.slice(0, visible);

  const loadMore = async () => {
    if (onLoadMore) {
      await onLoadMore();
    } else {
      setVisible((v) => v + pageSize);
    }
  };

  return (
    <section
      className={`rounded-2xl bg-white p-5 ring-1 ring-slate-200 ${className}`}
    >
      <h3 className="text-lg font-semibold text-slate-900">
        Khách hàng đánh giá
      </h3>

      {/* ===== Summary Row ===== */}
      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[200px,1fr]">
        {/* left: score */}
        <div className="rounded-xl border border-slate-200 p-4 text-center">
          {loading ? (
            <div className="mx-auto h-7 w-14 rounded bg-slate-100 animate-pulse" />
          ) : (
            <>
              <div className="text-3xl font-bold">{stats.avg}</div>
              <div className="mt-1">
                <Stars value={stats.avg} size={18} />
              </div>
              <div className="mt-1 text-xs text-slate-500">
                ({stats.total} đánh giá)
              </div>
            </>
          )}
        </div>

        {/* right: distribution + gallery */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((s) => (
                <DistributionBar
                  key={s}
                  label={`${s} ★`}
                  count={stats.buckets[s] || 0}
                  total={stats.total || 0}
                />
              ))}
            </div>

            {/* ảnh của tất cả reviews */}
            <div>
              <div className="mb-2 text-sm font-medium text-slate-900">
                Tất cả hình ảnh ({allImages.length})
              </div>
              <div className="grid grid-flow-col auto-cols-[80px] gap-2 overflow-x-auto pb-1">
                {loading &&
                  Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 rounded bg-slate-100 animate-pulse"
                    />
                  ))}
                {!loading &&
                  (allImages.length ? (
                    allImages.slice(0, 12).map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="block h-20 overflow-hidden rounded ring-1 ring-slate-200"
                      >
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ))
                  ) : (
                    <div className="flex h-20 items-center justify-center rounded border border-dashed border-slate-200 text-slate-400">
                      <ImageIcon className="mr-1 h-4 w-4" /> Chưa có ảnh
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* filters */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Chip active>Mới nhất</Chip>
            <Chip active={withPhotos} onClick={() => setWithPhotos((v) => !v)}>
              Có hình ảnh
            </Chip>
            <Chip
              active={verifiedOnly}
              onClick={() => setVerifiedOnly((v) => !v)}
            >
              Đã mua hàng
            </Chip>
            {[5, 4, 3, 2, 1].map((s) => (
              <Chip
                key={s}
                active={starFilter === s}
                onClick={() => setStarFilter(s)}
              >
                {s} sao
              </Chip>
            ))}
            {starFilter && (
              <button
                className="text-sm text-sky-700 underline"
                onClick={() => setStarFilter(undefined)}
              >
                Xoá lọc sao
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ===== List ===== */}
      <div className="mt-4 divide-y divide-slate-200">
        {/* skeleton */}
        {loading &&
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="grid grid-cols-[40px,1fr] gap-3 py-4">
              <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
              <div className="space-y-2">
                <div className="h-4 w-40 rounded bg-slate-100 animate-pulse" />
                <div className="h-3 w-3/5 rounded bg-slate-100 animate-pulse" />
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-16 rounded bg-slate-100 animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}

        {!loading &&
          list.map((r) => (
            <article
              key={r.id}
              className="grid grid-cols-[40px,1fr] gap-3 py-4"
            >
              {/* avatar */}
              <div className="mt-1">
                {r.author?.avatarUrl ? (
                  <img
                    src={r.author.avatarUrl}
                    className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                    alt=""
                  />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-500">
                    {(r.author?.name || 'NA').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* content */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="font-medium text-slate-900">
                    {r.author?.name || 'Người dùng'}
                  </div>
                  {r.verifiedPurchase && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Đã mua hàng
                    </span>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-xs text-slate-500">
                    {formatViDateTime(r.createdAt)}
                  </span>
                </div>

                {r.title && (
                  <div className="mt-1 font-medium text-slate-900">
                    {r.title}
                  </div>
                )}
                {r.body && (
                  <p className="mt-1 text-[15px] leading-6 text-slate-700">
                    {r.body}
                  </p>
                )}

                {r.variantText && (
                  <div className="mt-1 text-xs text-slate-500">
                    {r.variantText}
                  </div>
                )}

                {r.images?.length ? (
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {r.images.slice(0, 8).map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="block h-20 overflow-hidden rounded ring-1 ring-slate-200"
                      >
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                ) : null}

                <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <button className="inline-flex items-center gap-1 hover:text-slate-700">
                    <ThumbsUp className="h-4 w-4" /> Hữu ích{' '}
                    {r.helpfulCount ? `(${r.helpfulCount})` : ''}
                  </button>
                  <button className="inline-flex items-center gap-1 hover:text-slate-700">
                    <MessageSquare className="h-4 w-4" /> Bình luận{' '}
                    {r.commentCount ? `(${r.commentCount})` : ''}
                  </button>
                  <button className="ml-auto inline-flex items-center gap-1 hover:text-slate-700">
                    <Share2 className="h-4 w-4" /> Chia sẻ
                  </button>
                </div>
              </div>
            </article>
          ))}
      </div>

      {/* Load more */}
      {!loading && (hasMore || visible < filtered.length) && (
        <div className="mt-3 grid place-items-center">
          <button
            onClick={loadMore}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Xem thêm đánh giá
          </button>
        </div>
      )}
    </section>
  );
}
