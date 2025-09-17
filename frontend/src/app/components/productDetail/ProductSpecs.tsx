import React from "react";

export type SpecRow = { label?: string; value?: React.ReactNode };

export type ProductSpecsProps = {
  rows?: SpecRow[];       // dữ liệu specs
  loading?: boolean;      // hiển thị skeleton
  className?: string;
};

export default function ProductSpecs({
  rows = [],
  loading,
  className = "",
}: ProductSpecsProps) {
  return (
    <section className={`rounded-2xl bg-white p-5 ring-1 ring-slate-200 ${className}`}>
      <h3 className="mb-3 text-lg font-semibold text-slate-900">Thông tin chi tiết</h3>

      {/* loading skeleton */}
      {loading && (
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-3">
              <div className="h-3 w-40 rounded bg-slate-100 animate-pulse" />
              <div className="sm:col-span-2 h-3 w-64 rounded bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="text-slate-500">Chưa có thông tin chi tiết.</div>
      )}

      {!loading && rows.length > 0 && (
        <dl className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-3">
              <dt className="text-[13px] font-medium text-slate-500">{r.label || "—"}</dt>
              <dd className="sm:col-span-2 text-[15px] text-slate-800">{r.value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
