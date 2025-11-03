import React, { useMemo } from 'react';
import { FlashSaleHero } from '../../app/components/flash-sale/FlashSaleHero';
import { CountdownTimer } from '../../app/components/flash-sale/CountdownTimer';
import { CategoryTabs } from '../../app/components/flash-sale/CategoryTabs';
import { ProductGrid } from '../../app/components/flash-sale/ProductGrid';
import EveryMartHeader from '../components/Navbar';
import { FlashSaleProvider, useFlashSale } from '../context/FlashSaleContext';
import type { Product as FlashProduct } from '../components/flash-sale/types';
import type { Product as ServiceProduct } from '../../service/product.service';

function FlashSalePageInner() {
  const {
    categories,
    products,
    meta,
    activeCategoryId,
    setActiveCategory,
    loading,
    error,
  } = useFlashSale();

  const endAt = useMemo(
    () => meta?.endAt ?? Date.now() + 2 * 3600 * 1000,
    [meta]
  );

  function mapFlashProduct(p: FlashProduct): ServiceProduct {
    const saleRule = p.pricing_rules?.find((r) => r.type === 'flash_sale');
    return {
      id: p.id,
      uuid: p.uuid,
      name: p.name,
      slug: p.slug,
      avg_rating: parseFloat(String(p.avg_rating ?? 0)),
      review_count: p.review_count ?? 0,
      base_price: p.base_price,
      media: p.media?.map((m) => ({ ...m })) ?? [],
      status: p.status,
      created_at: p.created_at,
      updated_at: p.updated_at,
    };
  }

  return (
    <>
      <EveryMartHeader />
      <div className="min-h-screen bg-white text-gray-900">
        <FlashSaleHero stats={meta?.stats ?? []} />

        <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
          <div className="mb-8 md:mb-12">
            <CountdownTimer endAt={endAt} />
          </div>

          {loading ? (
            <>
              <div className="mb-8 h-10 w-40 animate-pulse rounded-lg bg-gray-100" />
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 animate-pulse rounded-xl border bg-gray-50"
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <CategoryTabs
                categories={categories}
                activeId={activeCategoryId}
                onChange={setActiveCategory}
              />
              <ProductGrid
                activeCategoryId={activeCategoryId}
              />
            </>
          )}
        </main>
      </div>
    </>
  );
}

export default function FlashSalePage() {
  return (
    <FlashSaleProvider
      config={{
        // baseUrl: không cần khi dùng axios `api` (đã set ở api.ts)
        endpoints: {
          // Nếu CHƯA có endpoint meta phía BE, hãy bỏ dòng `meta` để dùng fallback 2h.
          // meta: "/flashsale-meta",
          categories: '/categories',
          products: '/products/flash-sale',
          search: '/products/search',
        },
        flashOnly: true,
        pageSize: 24,
      }}
      initialCategory="all"
    >
      <FlashSalePageInner />
    </FlashSaleProvider>
  );
}
