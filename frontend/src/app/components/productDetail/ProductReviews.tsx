import React, { useEffect, useMemo, useState } from 'react';
import {
  Star,
  StarHalf,
  Image as ImageIcon,
} from 'lucide-react';
import { fetchProductReviews, Review } from '../../../service/product_review';

export type ProductReviewsProps = {
  productId: number;
  pageSize?: number;
  className?: string;
};

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

export default function ProductReviews({ productId, pageSize = 5, className = '' }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [withPhotos, setWithPhotos] = useState(false);
const [verifiedOnly, setVerifiedOnly] = useState(false);
const [starFilter, setStarFilter] = useState<number | undefined>(undefined);

const filtered = useMemo(() => {
  let arr = reviews;
  if (withPhotos) arr = arr.filter(r => (r.images?.length || 0) > 0);
  if (starFilter) arr = arr.filter(r => Math.round(r.rating) === starFilter);
  return arr.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
}, [reviews, withPhotos, starFilter]);
  const fetchReviews = async (pageToLoad: number) => {
    setLoading(true);
    try {
      const res = await fetchProductReviews(productId, pageToLoad, pageSize);
      setReviews(res.data ?? []);
      setPage(pageToLoad);
      setTotalPages(Math.ceil((res.total ?? res.data.length) / pageSize)); // dùng total nếu API trả về
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(1);
  }, [productId]);

  const allImages = useMemo(
    () => (reviews || []).flatMap(r => r.images ?? []),
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

const getImageUrl = (url?: string) =>
  !url
    ? 'https://via.placeholder.com/220x220?text=No+Image'
    : url.startsWith('http')
    ? url
    : `http://localhost:3000/${url.replace(/^\/+/, '')}`;
    const getInitials = (name?: string) => {
  if (!name) return 'NA';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase(); // tên 1 từ, lấy 2 ký tự đầu
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase(); // tên nhiều từ, lấy chữ cái đầu và cuối
};




 return (
  <section className={`rounded-2xl bg-white p-5 ring-1 ring-slate-200 ${className}`}>
    <h3 className="text-lg font-semibold text-slate-900">Khách hàng đánh giá</h3>

    {/* Summary */}
    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-[200px,1fr]">
      <div className="rounded-xl border border-slate-200 p-4 text-center">
        {loading ? (
          <div className="mx-auto h-7 w-14 rounded bg-slate-100 animate-pulse" />
        ) : (
          <>
            <div className="text-3xl font-bold">{stats.avg}</div>
            <div className="mt-1"><Stars value={stats.avg} size={18} /></div>
            <div className="mt-1 text-xs text-slate-500">({stats.total} đánh giá)</div>
          </>
        )}
      </div>

      {/* Gallery */}
      <div className="space-y-3">
        <div>
          <div className="mb-2 text-sm font-medium text-slate-900">
            Tất cả hình ảnh ({allImages.length})
          </div>
          <div className="grid grid-flow-col auto-cols-[80px] gap-2 overflow-x-auto pb-1">
            {loading &&
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-20 rounded bg-slate-100 animate-pulse" />
              ))}
            {!loading &&
              allImages.length > 0 &&
              allImages.slice(0, 12).map((src, i) => (
                <a
                  key={i}
                  href={getImageUrl(src)}
                  target="_blank"
                  rel="noreferrer"
                  className="block h-20 overflow-hidden rounded ring-1 ring-slate-200"
                >
                  <img src={getImageUrl(src)} alt="" className="h-full w-full object-cover" />
                </a>
              ))}
            {!loading && allImages.length === 0 && (
              <div className="flex h-20 items-center justify-center rounded border border-dashed border-slate-200 text-slate-400">
                <ImageIcon className="mr-1 h-4 w-4" /> Chưa có ảnh
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* Filters */}
    <div className="flex flex-wrap items-center gap-2 pt-4">
      <button className="px-3 py-1 rounded border bg-white text-slate-700 border-slate-200 hover:bg-slate-50">
        Mới nhất
      </button>
      <button
        className={`px-3 py-1 rounded border ${withPhotos ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
        onClick={() => setWithPhotos(v => !v)}
      >
        Có hình ảnh
      </button>
      <button
        className={`px-3 py-1 rounded border ${verifiedOnly ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
        onClick={() => setVerifiedOnly(v => !v)}
      >
        Đã mua hàng
      </button>
      {[5, 4, 3, 2, 1].map(s => (
        <button
          key={s}
          className={`px-3 py-1 rounded border ${starFilter === s ? 'border-sky-600 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
          onClick={() => setStarFilter(s)}
        >
          {s} sao
        </button>
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

    {/* Review List */}
    <div className="mt-4 divide-y divide-slate-200">
      {loading && Array.from({ length: pageSize }).map((_, idx) => (
        <div key={idx} className="grid grid-cols-[40px,1fr] gap-3 py-4">
          <div className="h-10 w-10 rounded-full bg-slate-100 animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-slate-100 animate-pulse" />
            <div className="h-3 w-3/5 rounded bg-slate-100 animate-pulse" />
            <div className="grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded bg-slate-100 animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      ))}

      {!loading && filtered.map(r => (
        <article key={r.id} className="grid grid-cols-[40px,1fr] gap-3 py-4">
{/* Avatar */}
<div className="mt-1">
  {r.author?.avatarUrl ? (
    <img
  src={getImageUrl(r.author?.avatarUrl)}
  className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
  alt={r.author?.name || 'User'}
/>
  ) : (
    <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-500">
      {getInitials(r.author?.name)}
    </div>
  )}
</div>



          {/* Content */}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div className="font-medium text-slate-900">{r.author?.name || 'Người dùng'}</div>
              <Stars value={r.rating} />
              <span className="text-xs text-slate-500">{formatViDateTime(r.createdAt)}</span>
            </div>
            {r.title && <div className="mt-1 font-medium text-slate-900">{r.title}</div>}
            {r.body && <p className="mt-1 text-[15px] leading-6 text-slate-700">{r.body}</p>}

            {/* Images of this review */}
            {r.images?.length ? (
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {r.images.slice(0, 8).map((src, i) => (
                  <a key={i} href={getImageUrl(src)} target="_blank" rel="noreferrer" className="block h-20 overflow-hidden rounded ring-1 ring-slate-200">
                    <img src={getImageUrl(src)} alt="" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </article>
      ))}
    </div>

    {/* Pagination */}
    {!loading && totalPages > 1 && (
      <div className="mt-3 flex gap-2 justify-center">
        {Array.from({ length: totalPages }, (_, i) => {
          const pageNumber = i + 1;
          return (
            <button
              key={i}
              onClick={() => fetchReviews(pageNumber)}
              className={`px-3 py-1 rounded border ${
                pageNumber === page
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {pageNumber}
            </button>
          );
        })}
      </div>
    )}
  </section>
);
}