import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Gallery({
  images,
  variantMap,
  selectedVariantId,
  setSelectedVariantId,
  width,
  galleryHeight = 400,
  thumbHeight = 60,
  stickyTop,
}: {
  images?: string[];
  variantMap?: { [key: number]: number };
  selectedVariantId: number | null;
  setSelectedVariantId: (id: number) => void;
  width?: number;
  galleryHeight?: number;
  thumbHeight?: number;
  stickyTop?: number;
}) {
  const list = images ?? [];
  const [idx, setIdx] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    if (
      selectedVariantId !== null &&
      variantMap &&
      variantMap[selectedVariantId] !== undefined
    ) {
      setIdx(variantMap[selectedVariantId]);
    } else if (list.length > 0) {
      setIdx(0);
    }
  }, [selectedVariantId, variantMap, list]);

  const resolveUrl = (u: string) =>
    u.startsWith('http') ? u : `http://localhost:3000/${u.replace(/^\/+/, '')}`;

  const current =
    list.length > 0
      ? resolveUrl(list[Math.min(idx, list.length - 1)])
      : undefined;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && idx < list.length - 1) {
      setIdx(idx + 1);
    } else if (isRightSwipe && idx > 0) {
      setIdx(idx - 1);
    }
  };

  const nextImage = () => {
    if (idx < list.length - 1) setIdx(idx + 1);
  };

  const prevImage = () => {
    if (idx > 0) setIdx(idx - 1);
  };

  return (
    <section
      className={`self-start bg-white ring-1 ring-slate-200 ${
        width ? 'lg:sticky rounded-2xl p-4' : 'rounded-xl p-3'
      }`}
      style={{ width, top: stickyTop ?? 0 }}
    >
      {/* Main Image with Swipe Support */}
      <div
        className="relative grid place-items-center overflow-hidden rounded-xl bg-slate-100"
        style={{ height: galleryHeight }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {current ? (
          <img
            src={current}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '';
            }}
          />
        ) : (
          <ImageIcon className="h-10 w-10 text-slate-300" />
        )}

        {/* Navigation Arrows - Show on desktop and when multiple images */}
        {list.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all lg:flex hidden"
              disabled={idx === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all lg:flex hidden"
              disabled={idx === list.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {list.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white px-2 py-1 rounded-full text-xs">
            {idx + 1} / {list.length}
          </div>
        )}
      </div>

      {/* Thumbnails - Horizontal scroll on mobile, grid on desktop */}
      {list.length > 1 && (
        <div className="mt-3">
          <div className="flex lg:grid lg:grid-cols-4 gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {list.map((u, i) => {
              const imageUrl = resolveUrl(u);
              const variantId = Object.keys(variantMap || {}).find(
                (key) => variantMap![Number(key)] === i
              );
              return (
                <button
                  key={i}
                  onClick={() => {
                    setIdx(i);
                    if (variantId) {
                      setSelectedVariantId(Number(variantId));
                    }
                  }}
                  className={`flex-shrink-0 overflow-hidden rounded-lg ring-2 transition-all ${
                    idx === i 
                      ? 'ring-sky-500 ring-offset-2' 
                      : 'ring-slate-200 hover:ring-slate-300'
                  }`}
                  style={{ 
                    height: thumbHeight, 
                    width: thumbHeight 
                  }}
                  aria-label={`Ảnh ${i + 1}`}
                >
                  <img
                    src={imageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Additional Actions */}
      <button className="mt-4 w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
        <ImageIcon className="h-4 w-4" />
        Xem thêm Tóm tắt nội dung sách
      </button>
    </section>
  );
}