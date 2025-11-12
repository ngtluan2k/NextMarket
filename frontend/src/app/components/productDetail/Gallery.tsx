import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface GalleryProps {
  images?: string[];
  width?: number;
  galleryHeight?: number;
  thumbHeight?: number;
  stickyTop?: number;
}

export default function Gallery({
  images,
  width,
  galleryHeight,
  thumbHeight,
  stickyTop,
}: GalleryProps) {
  const list = images ?? [];

  // Debug log để xem số lượng và thứ tự ảnh
  useEffect(() => {
    console.log('Gallery images loaded:', list);
  }, [list]);

  const [idx, setIdx] = useState(0);

  // Reset idx khi list thay đổi
  useEffect(() => {
    setIdx(0);
  }, [list]);
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

  const resolveUrl = (u: string) =>
    u.startsWith('http') ? u : `${BE_BASE_URL}/${u.replace(/^\/+/, '')}`;

  const current = list[idx] ? resolveUrl(list[idx]) : undefined;

  return (
    <section
      className="self-start rounded-2xl bg-white p-4 ring-1 ring-slate-200 lg:sticky"
      style={{ width, top: stickyTop ?? 0 }}
    >
      {/* Ảnh lớn */}
      <div
        className="grid place-items-center overflow-hidden rounded-xl bg-slate-100"
        style={{ height: galleryHeight }}
      >
        {current ? (
          <img
            src={current}
            alt={`Ảnh lớn ${idx + 1}`}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '';
            }}
          />
        ) : (
          <ImageIcon className="h-10 w-10 text-slate-300" />
        )}
      </div>

      {/* Thumbnails */}
      <div className="mt-3 grid grid-cols-4 gap-3">
        {list.map((u, i) => {
          const imageUrl = resolveUrl(u);
          return (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`overflow-hidden rounded-lg ring-1 ${
                idx === i ? 'ring-sky-500' : 'ring-slate-200'
              }`}
              style={{ height: thumbHeight }}
              aria-label={`Thumbnail ${i + 1}`}
            >
              <img
                src={imageUrl}
                alt={`Thumbnail ${i + 1}`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '';
                }}
              />
            </button>
          );
        })}

        {/* Placeholder nếu không có ảnh */}
        {list.length === 0 &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-slate-100"
              style={{ height: thumbHeight }}
            />
          ))}
      </div>

      {/* Nút xem thêm */}
      <button className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
        <ImageIcon className="h-4 w-4" />
        Xem thêm Tóm tắt nội dung sách
      </button>
    </section>
  );
}
