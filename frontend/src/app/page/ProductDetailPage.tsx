// src/app/page/ProductDetailPage.tsx
import React, { useState, useEffect } from 'react';
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
import { useCart } from '../context/CartContext';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug ?? '';
  const { loading, product, combos } = useProductDetail(slug);

  // --- state quản lý variant + qty ---
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    null
  );
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (!product) return;
    const defaultVariant = product.variants?.[0]?.id ?? null;
    setSelectedVariantId(defaultVariant);
    setQuantity(1);
  }, [product]);

  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product.id, quantity, selectedVariantId);
      console.log('✅ Đã thêm vào giỏ');
    } catch (err) {
      console.error('❌ Thêm thất bại', err);
    }
  };

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
            {/* TRÁI: Gallery */}
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

            {/* GIỮA: Info + Shipping + ComboStrip + Specs + Description */}
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

            {/* PHẢI: BuyBox */}
            <div className="lg:col-start-3 lg:row-span-2 lg:self-stretch">
              <div className="lg:sticky" style={{ top: L.buyBoxStickyTop }}>
                <BuyBox
                  product={product}
                  width={L.rightWidth}
                  minHeight={L.buyBoxMinHeight}
                  selectedVariantId={selectedVariantId}
                  quantity={quantity}
                  setQuantity={setQuantity}
                  onAddToCart={() => handleAddToCart()} // truyền callback chuẩn
                />
              </div>
            </div>

            {/* REVIEWS */}
            <div className="lg:col-start-1 lg:col-span-2 lg:row-start-2 space-y-4 self-start">
              <ProductReviews />
            </div>

            {/* Explore more */}
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
