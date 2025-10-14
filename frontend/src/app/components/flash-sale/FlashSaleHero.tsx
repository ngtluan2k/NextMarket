"use client";
import React from "react";

interface StatBox { label: string; value: string; }

export function FlashSaleHero({
  stats = [],
  title = <>Săn Sale Khủng<br />Giảm Đến 70%</>,
  subtitle = "Hàng ngàn sản phẩm chất lượng với giá không thể tin được. Nhanh tay kẻo hết!",
}: {
  stats?: StatBox[];
  title?: React.ReactNode;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-500 to-fuchsia-500">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,white_0,transparent_25%)] opacity-10" />
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur">
            <span>Flash Sale Đặc Biệt</span>
          </div>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-white/90 md:text-xl">{subtitle}</p>
          {stats.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4">
              {stats.map((s) => (
                <div key={s.label} className="rounded-lg bg-white px-6 py-3 text-center">
                  <div className="text-2xl font-bold text-indigo-600 md:text-3xl">{s.value}</div>
                  <div className="text-sm text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
