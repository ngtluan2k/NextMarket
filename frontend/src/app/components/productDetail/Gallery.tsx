import React, { useState, useEffect } from "react";
import { Image as ImageIcon } from "lucide-react";

export default function Gallery({
  images,
  variantMap,
  selectedVariantId,
  setSelectedVariantId,
  width,
  galleryHeight,
  thumbHeight,
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

  // Sync gallery index with selected variant
  useEffect(() => {
    if (selectedVariantId !== null && variantMap && variantMap[selectedVariantId] !== undefined) {
      setIdx(variantMap[selectedVariantId]);
    } else if (list.length > 0) {
      setIdx(0); // Default to first image if no variant selected or no mapping
    }
  }, [selectedVariantId, variantMap, list]);

  // Hàm xử lý URL ảnh
  const resolveUrl = (u: string) =>
    u.startsWith("http")
      ? u
      : `http://localhost:3000/${u.replace(/^\/+/, "")}`;

  const current =
    list.length > 0 ? resolveUrl(list[Math.min(idx, list.length - 1)]) : undefined;

  return (
    <section
      className="self-start rounded-2xl bg-white p-4 ring-1 ring-slate-200 lg:sticky"
      style={{ width, top: stickyTop ?? 0 }}
    >
      <div
        className="grid place-items-center overflow-hidden rounded-xl bg-slate-100"
        style={{ height: galleryHeight }}
      >
        {current ? (
          <img
            src={current}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://via.placeholder.com/300x300?text=No+Image";
            }}
          />
        ) : (
          <ImageIcon className="h-10 w-10 text-slate-300" />
        )}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-3">
        {list.map((u, i) => {
          const imageUrl = resolveUrl(u);
          // Find the variant ID for this image index
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
              className={`overflow-hidden rounded-lg ring-1 ${
                idx === i ? "ring-sky-500" : "ring-slate-200"
              }`}
              style={{ height: thumbHeight }}
              aria-label={`Ảnh ${i + 1}`}
            >
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://via.placeholder.com/100x100?text=No+Img";
                }}
              />
            </button>
          );
        })}

        {list.length === 0 &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-slate-100"
              style={{ height: thumbHeight }}
            />
          ))}
      </div>

      <button className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
        <ImageIcon className="h-4 w-4" />
        Xem thêm Tóm tắt nội dung sách
      </button>
    </section>
  );
}