import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import EveryMartHeader from '../components/Navbar';
import Footer from '../components/Footer';
import { useProductDetail } from '../hooks/useProductDetail';
import { PRODUCT_DETAIL_LAYOUT as L } from '../components/productDetail/productDetail';
import {
  Gallery,
  Info,
  Shipping,
  ComboStrip,
} from '../components/productDetail';
import SimilarProducts from '../components/productDetail/SimilarProducts';
import ProductDescription from '../components/productDetail/ProductDescription';
import ProductReviews from '../components/productDetail/ProductReviews';
import ExploreMore from '../components/productDetail/ExploreMore';
import ProductSpecs from '../components/productDetail/ProductSpecs';
import BuyBox from '../components/productDetail/BuyBox';

interface Props {
  showMessage?: (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => void;
}

export default function ProductDetailPage({ showMessage }: Props) {
  const params = useParams();
  const slug = params.slug ?? ''; // lấy slug từ URL
  const { loading, product, combos } = useProductDetail(slug);

  // Shared state for pricing calculation
  const [selectedVariantId, setSelectedVariantId] = useState<number>(
    product?.variants?.[0]?.id ?? null
  );
  const [quantity, setQuantity] = useState(1);

  // Calculate price with pricing rules (same logic as Info.tsx)
  const calculatedPrice = useMemo(() => {
    if (!product) return 0;

    // 1. Base price
    let currentPrice = Number(product.base_price ?? 0);

    // 2. Variant price
    if (selectedVariantId) {
      const variant = product.variants?.find(
        (v: any) => v.id === selectedVariantId
      );
      if (variant) currentPrice = Number(variant.price);
    }

    // 3. Apply pricing rules
    const now = new Date();
    const validRules = (product.pricing_rules ?? [])
      .filter((r: any) => {
        const start = r.starts_at ? new Date(r.starts_at) : new Date(0);
        const end = r.ends_at
          ? new Date(r.ends_at)
          : new Date(8640000000000000);
        return quantity >= r.min_quantity && now >= start && now <= end;
      })
      .sort((a: any, b: any) => b.min_quantity - a.min_quantity);

    if (validRules.length) currentPrice = Number(validRules[0].price);

    return currentPrice;
  }, [product, selectedVariantId, quantity]);

  return (
    <>
      <EveryMartHeader />
      <main className="bg-slate-50 px-4 py-6">
        <div className="mx-auto" style={{ maxWidth: L.container }}>
          <div
            className="grid gap-4 lg:grid-cols-[var(--left)_minmax(0,1fr)_var(--right)] items-start"
            style={{
              ['--left' as any]: `${L.leftWidth}px`,
              ['--right' as any]: `${L.rightWidth}px`,
            }}
          >
            {/* TRÁI: chỉ hàng 1, để self-start để dừng trước Reviews */}
            <div className="lg:col-start-1 lg:row-start-1 lg:self-stretch">
              <Gallery
                images={
                  Array.isArray(product?.media)
                    ? product.media.map((m: { url: string }) => m.url)
                    : []
                }
                width={L.leftWidth}
                galleryHeight={L.galleryHeight}
                thumbHeight={L.thumbHeight}
                stickyTop={L.buyBoxStickyTop}
              />
            </div>

            {/* GIỮA: hàng 1 */}
            <section className="lg:col-start-2 lg:row-start-1 space-y-4 min-w-0 self-start">
              <Info
                product={product}
                selectedVariantId={selectedVariantId}
                setSelectedVariantId={setSelectedVariantId}
                quantity={quantity}
                setQuantity={setQuantity}
              />
              <Shipping />
              <ComboStrip items={combos} />
              <SimilarProducts />
              <ProductSpecs product={product} loading={loading} />
              <ProductDescription
                html={product?.short_description}
                loading={!product}
              />
            </section>

            {/* PHẢI: span 2 hàng + TỰ KÉO GIÃN = cha cao bằng cả phần Reviews */}
            <div className="lg:col-start-3 lg:row-span-2 lg:self-stretch">
              <div className="lg:sticky" style={{ top: L.buyBoxStickyTop }}>
                <BuyBox
                  product={product}
                  selectedVariantId={selectedVariantId}
                  quantity={quantity}
                  setQuantity={setQuantity}
                  calculatedPrice={calculatedPrice}
                  width={L.rightWidth}
                  minHeight={L.buyBoxMinHeight}
                  showMessage={showMessage}
                />
              </div>
            </div>

            {/* REVIEWS: hàng 2, chiếm 2 cột (trái+giữa) */}
            <div className="lg:col-start-1 lg:col-span-2 lg:row-start-2 space-y-4 self-start">
              <ProductReviews />
            </div>

            <div className="lg:col-span-3 mt-2">
              <ExploreMore />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
