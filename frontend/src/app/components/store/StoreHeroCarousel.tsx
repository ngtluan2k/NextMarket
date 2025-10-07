import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export type StoreSlide = {
  id: string | number;
  imageUrl: string;
  href?: string;
  alt?: string;
};

type Props = {
  slides?: StoreSlide[];
  loading?: boolean;
  error?: string | null;
  autoPlay?: boolean;
  intervalMs?: number;
  className?: string;
  onSlideChange?: (index: number) => void;
};

export default function StoreHeroCarousel({
  slides = [],
  loading = false,
  error = null,
  autoPlay = true,
  intervalMs = 4000,
  className,
  onSlideChange,
}: Props) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const touchRef = useRef<{ x: number; y: number } | null>(null);

  const H = 'h-40 sm:h-52 md:h-60';
  const count = slides.length;
  const safeIdx = (i: number) => (count ? (i + count) % count : 0);

  useEffect(() => {
    if (!autoPlay || count === 0) return;
    const start = () => {
      stop();
      timerRef.current = window.setInterval(
        () => setIdx((i) => safeIdx(i + 1)),
        intervalMs
      );
    };
    const stop = () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, autoPlay, intervalMs]);

  useEffect(() => {
    onSlideChange?.(idx);
  }, [idx, onSlideChange]);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    if (Math.abs(dx) > 40) setIdx((i) => safeIdx(i + (dx < 0 ? 1 : -1)));
    touchRef.current = null;
  };

  const go = (i: number) => setIdx(safeIdx(i));
  const prev = () => setIdx((i) => safeIdx(i - 1));
  const next = () => setIdx((i) => safeIdx(i + 1));

  const skeletons = useMemo(() => Array.from({ length: 2 }), []);

  return (
    <section
      className={[
        'mt-3 rounded-2xl border border-slate-200 bg-white shadow-sm',
        className ?? '',
      ].join(' ')}
    >
      <div className="px-4 py-3 sm:px-6">
        <div
          ref={wrapRef}
          className="relative overflow-hidden rounded-xl"
          onMouseEnter={() =>
            timerRef.current && window.clearInterval(timerRef.current)
          }
          onMouseLeave={() =>
            autoPlay &&
            (timerRef.current = window.setInterval(next, intervalMs))
          }
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          aria-roledescription="carousel"
        >
          {/* viewport */}
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${idx * 100}%)` }}
          >
            {loading ? (
              skeletons.map((_, i) => (
                <div
                  key={i}
                  className={`${H} w-full shrink-0 bg-slate-100 animate-pulse`}
                />
              ))
            ) : error ? (
              <div
                className={`${H} w-full shrink-0 bg-red-50 flex items-center justify-center text-red-600 text-sm border border-red-200`}
              >
                {error}
              </div>
            ) : count === 0 ? (
              <div
                className={`${H} w-full shrink-0 bg-slate-50 flex items-center justify-center text-slate-500 text-sm border border-slate-200`}
              >
                Chưa có banner
              </div>
            ) : (
              slides.map((s) => {
                const img = (
                  <img
                    src={s.imageUrl}
                    alt={s.alt || 'banner'}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                );
                return (
                  <div
                    key={s.id}
                    className={`${H} w-full shrink-0 select-none`}
                  >
                    {s.href ? (
                      <Link to={s.href} aria-label="banner">
                        {img}
                      </Link>
                    ) : (
                      img
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* arrows */}
          {count > 1 && (
            <>
              <button
                onClick={prev}
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white"
              >
                ‹
              </button>
              <button
                onClick={next}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white"
              >
                ›
              </button>
            </>
          )}

          {/* indicators */}
          {count > 1 && (
            <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center gap-2">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => go(i)}
                  className={[
                    'pointer-events-auto h-2.5 w-2.5 rounded-full ring-1 ring-slate-300',
                    i === idx
                      ? 'bg-white shadow'
                      : 'bg-white/60 hover:bg-white',
                  ].join(' ')}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
