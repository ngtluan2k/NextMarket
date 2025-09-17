import React, { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

export default function Gallery({
  images,
  width,
  galleryHeight,
  thumbHeight,
  stickyTop,
}: {
  images?: string[];
  width?: number;
  galleryHeight?: number;
  thumbHeight?: number;
  stickyTop?: number;
}) {
  const list = images ?? [];
  const [idx, setIdx] = useState(0);
  const current = list.length ? list[Math.min(idx, list.length - 1)] : undefined;

  return (
    <section
<<<<<<< HEAD
      className="self-start rounded-2xl bg-white p-4 ring-1 ring-slate-200 "
      style={{ width,
        top: stickyTop ?? 0,
       }}
=======
    className="self-start rounded-2xl bg-white p-4 ring-1 ring-slate-200 lg:sticky"
      style={{ width, top: stickyTop ?? 0 }}
>>>>>>> 45287316b3ee477283821a21b168cc772f49f523
    >
      <div
        className="grid place-items-center overflow-hidden rounded-xl bg-slate-100"
        style={{ height: galleryHeight }}
      >
        {current ? (
          <img src={current} alt="" className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-10 w-10 text-slate-300" />
        )}
      </div>

      <div className="mt-3 grid grid-cols-4 gap-3">
        {list.slice(0, 4).map((u, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`overflow-hidden rounded-lg ring-1 ${
              idx === i ? "ring-sky-500" : "ring-slate-200"
            }`}
            style={{ height: thumbHeight }}
            aria-label={`Ảnh ${i + 1}`}
          >
            <img src={u} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
        {list.length === 0 &&
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-lg bg-slate-100" style={{ height: thumbHeight }} />
          ))}
      </div>

      <button className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
        <ImageIcon className="h-4 w-4" />
        Xem thêm Tóm tắt nội dung sách
      </button>
    </section>
  );
}