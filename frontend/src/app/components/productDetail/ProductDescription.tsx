import React, { useMemo, useState } from 'react';

export type ProductDescriptionProps = {
  /** HTML đã sanitize từ backend (khuyên dùng) */
  html?: string;
  /** Text thuần (fallback nếu bạn chưa có html) */
  text?: string;
  /** Hiển thị xương cá khi đang tải */
  loading?: boolean;
  /** chiều cao khi thu gọn */
  collapsedHeight?: number; // px
  className?: string;
};

export default function ProductDescription({
  html,
  text,
  loading,
  collapsedHeight = 260,
  className = '',
}: ProductDescriptionProps) {
  const [expanded, setExpanded] = useState(false);

  const safeHtml = useMemo(() => {
    if (html) return html;
    if (!text) return '';
    // chuyển \n -> <br/> cho text thuần
    return text.replace(/\n/g, '<br/>');
  }, [html, text]);

  return (
    <section
      className={`rounded-2xl bg-white p-5 ring-1 ring-slate-200 ${className}`}
    >
      <h3 className="mb-3 text-lg font-semibold text-slate-900">
        Mô tả sản phẩm
      </h3>

      {/* loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-3 w-full rounded bg-slate-100 animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && !safeHtml && (
        <div className="text-slate-500">Chưa có mô tả.</div>
      )}

      {!loading && safeHtml && (
        <div className="relative">
          <div
            className={`prose prose-slate max-w-none text-[15px] leading-7 ${
              expanded ? '' : 'overflow-hidden'
            }`}
            style={expanded ? undefined : { maxHeight: collapsedHeight }}
            // ⚠️ Nội dung html phải được sanitize ở BE trước khi render
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />

          {/* fade khi thu gọn */}
          {!expanded && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16"
              style={{
                background:
                  'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))',
              }}
            />
          )}

          <div className="mt-3 grid place-items-center">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {expanded ? 'Thu gọn' : 'Xem thêm'}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
