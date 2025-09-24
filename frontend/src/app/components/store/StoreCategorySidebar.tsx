import React, { useState } from "react";

export type StoreCategory = {
  id: string | number;
  name: string;
  count?: number;         // optional, nếu muốn hiện số lượng
};

type Props = {
  items: StoreCategory[];
  selectedId?: string | number | null;
  onSelect?: (id: string | number | null) => void;
  className?: string;
  title?: string;
  maxVisible?: number;    // số mục hiển thị trước khi bấm "Xem thêm"
};

export default function StoreCategorySidebarSimple({
  items,
  selectedId = null,
  onSelect,
  className,
  title = "Danh mục sản phẩm",
  maxVisible = 10,
}: Props) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? items : items.slice(0, maxVisible);
  const hasMore = items.length > maxVisible;

  return (
    <aside className={["rounded-2xl border border-slate-200 bg-white p-3 shadow-sm", className || ""].join(" ")}>
      <div className="mb-2 px-1 text-sm font-semibold text-slate-900">{title}</div>

      {/* nút "Tất cả" */}
      <button
        onClick={() => onSelect?.(null)}
        className={[
          "block w-full rounded px-1 py-1.5 text-left text-sm leading-5",
          selectedId == null ? "font-medium text-slate-900" : "text-slate-700 hover:text-slate-900",
        ].join(" ")}
      >
        Tất cả
      </button>

      <ul className="mt-1 divide-y divide-slate-100">
        {visible.map((c) => {
          const active = String(selectedId ?? "") === String(c.id);
          return (
            <li key={c.id} className="first:pt-0 last:pb-0">
              <button
                onClick={() => onSelect?.(c.id)}
                className={[
                  "block w-full px-1 py-2 text-left text-sm leading-5",
                  active ? "font-medium text-slate-900" : "text-slate-700 hover:text-slate-900",
                ].join(" ")}
              >
                <span className="break-words">{c.name}</span>
                {/* nếu muốn số lượng ở cuối:
                {typeof c.count === "number" && (
                  <span className="ml-1 text-xs text-slate-500">({c.count.toLocaleString("vi-VN")})</span>
                )} */}
              </button>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <div className="mt-2 px-1">
          <button
            className="text-sm font-medium text-blue-600 hover:underline"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Thu gọn" : "Xem thêm"}
          </button>
        </div>
      )}
    </aside>
  );
}
