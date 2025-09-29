import React, { useEffect, useState } from "react";

export type StoreCategory = {
  id: string | number;
  name: string;
  slug: string;
  count?: number; // optional, số lượng sản phẩm
};

type Props = {
  items?: StoreCategory[];
  fetchItems?: () => Promise<StoreCategory[]>;
  selectedSlug?: string | null;
  onSelect?: (slug: string | null) => void;
  className?: string;
  title?: string;
  maxVisible?: number;
};

export default function StoreCategorySidebar({
  items,
  fetchItems,
  selectedSlug = null,
  onSelect,
  className,
  title = "Danh mục sản phẩm",
  maxVisible = 10,
}: Props) {
  const [fetched, setFetched] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(!!fetchItems);
  const [showAll, setShowAll] = useState(false);

  // Nếu có fetchItems thì tự fetch
  useEffect(() => {
    let alive = true;
    if (fetchItems) {
      (async () => {
        try {
          setLoading(true);
          const data = await fetchItems();
          if (alive) setFetched(data);
        } catch (err) {
          console.error("Fetch categories failed:", err);
        } finally {
          if (alive) setLoading(false);
        }
      })();
    }
    return () => {
      alive = false;
    };
  }, [fetchItems]);

  // Ưu tiên items từ props, nếu không có thì dùng fetched
  const categories = items ?? fetched;
  const visible = showAll ? categories : categories.slice(0, maxVisible);
  const hasMore = categories.length > maxVisible;

  return (
    <aside
      className={[
        "rounded-2xl border bg-white p-3 shadow-sm",
        className || "",
      ].join(" ")}
    >
      <div className="mb-2 text-sm font-semibold">{title}</div>

      <button
        onClick={() => onSelect?.(null)}
        className={
          selectedSlug == null
            ? "font-medium text-slate-900 block w-full text-left py-1.5"
            : "text-slate-700 hover:text-slate-900 block w-full text-left py-1.5"
        }
      >
        Tất cả
      </button>

      {loading ? (
        <div className="mt-2 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-4 w-full rounded bg-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <ul className="mt-1 divide-y divide-slate-100">
          {visible.map((c) => {
            const active = selectedSlug === c.slug;
            return (
              <li key={c.id}>
                <button
                  onClick={() => onSelect?.(c.slug)}
                  className={
                    active
                      ? "font-medium text-slate-900 block w-full text-left py-2"
                      : "text-slate-700 hover:text-slate-900 block w-full text-left py-2"
                  }
                >
                  {c.name}
                  {typeof c.count === "number" && (
                    <span className="ml-1 text-xs text-slate-500">
                      ({c.count.toLocaleString("vi-VN")})
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <div className="mt-2">
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Thu gọn" : "Xem thêm"}
          </button>
        </div>
      )}
    </aside>
  );
}
