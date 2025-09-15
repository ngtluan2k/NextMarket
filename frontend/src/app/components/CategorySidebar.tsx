import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

/** Cấu trúc danh mục */
export type CatNode = {
  id: string | number;
  name: string;
  children?: CatNode[];
};

type Props = {
  title?: string;
  /** Có thể bỏ trống; nếu truyền thì render ngay dữ liệu này */
  items?: CatNode[];
  /** Hàm gọi API; nếu truyền, component sẽ tự fetch khi mount */
  fetchCategories?: () => Promise<CatNode[]>;
  className?: string;
  onSelect?: (node: CatNode) => void;
  defaultOpenIds?: Array<string | number>;
};

export default function CategorySidebar({
  title = "Khám phá theo danh mục",
  items,
  fetchCategories,
  className = "",
  onSelect,
  defaultOpenIds = [],
}: Props) {
  // mở/đóng mục
  const initialOpen = useMemo(
    () =>
      defaultOpenIds.reduce<Record<string | number, boolean>>((acc, id) => {
        acc[id] = true;
        return acc;
      }, {}),
    [defaultOpenIds]
  );
  const [open, setOpen] = useState<Record<string | number, boolean>>(initialOpen);

  // dữ liệu + loading
  const [list, setList] = useState<CatNode[]>(items ?? []);
  const [loading, setLoading] = useState<boolean>(!!fetchCategories);

  // đồng bộ nếu props.items thay đổi
  useEffect(() => {
    if (items) setList(items);
  }, [items]);

  // tự fetch nếu có fetchCategories
  useEffect(() => {
    let cancelled = false;
    if (!fetchCategories) return;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchCategories();
        if (!cancelled && Array.isArray(data)) setList(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fetchCategories]);

  const toggle = (id: string | number) =>
    setOpen((s) => ({ ...s, [id]: !s[id] }));

  return (
    <aside
      className={`w-full rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 ${className}`}
      aria-label={title}
    >
      <div className="px-4 py-3 text-sm font-bold text-slate-900">{title}</div>

      {/* Loading skeleton */}
      {loading ? (
        <ul className="animate-pulse divide-y divide-slate-100">
          {Array.from({ length: 12 }).map((_, i) => (
            <li key={i} className="px-4 py-4">
              <div className="h-3 w-40 rounded bg-slate-200" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-slate-100">
          {list.map((node) => (
            <li key={node.id}>
              <button
                onClick={() => (node.children?.length ? toggle(node.id) : onSelect?.(node))}
                className="flex w-full items-center justify-between px-4 py-4 text-left hover:bg-slate-50"
                aria-expanded={!!open[node.id]}
              >
                <span className="text-sm text-slate-800">{node.name}</span>
                {node.children?.length ? (
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform ${
                      open[node.id] ? "rotate-180" : ""
                    }`}
                  />
                ) : (
                  <ChevronDown className="h-4 w-4 text-transparent" />
                )}
              </button>

              {node.children?.length ? (
                <div
                  className={`overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out ${
                    open[node.id] ? "grid grid-rows-[1fr]" : "grid grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0">
                    <ul className="px-4 pb-3">
                      {node.children.map((c) => (
                        <li key={c.id}>
                          <button
                            onClick={() => onSelect?.(c)}
                            className="block w-full rounded-md px-3 py-2 text-left text-[13px] text-slate-600 hover:bg-slate-50"
                          >
                            {c.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : null}
            </li>
          ))}

          {/* Nếu không có dữ liệu (và không loading) thì để trống gọn gàng */}
          {!loading && list.length === 0 && (
            <li className="px-4 py-4 text-[13px] text-slate-400">Chưa có danh mục</li>
          )}
        </ul>
      )}
    </aside>
  );
}
