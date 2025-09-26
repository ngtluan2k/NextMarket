import React, { lazy, Suspense, useEffect, useMemo, useState } from 'react';
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
import { Spin } from 'antd';

interface Props {
  showMessage?: (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => void;
}
const LazySimilarProducts = lazy(
  () => import('../components/productDetail/SimilarProducts')
);
const LazyProductReviews = lazy(
  () => import('../components/productDetail/ProductReviews')
);
const LazyExploreMore = lazy(
  () => import('../components/productDetail/ExploreMore')
);

// Memoize static or infrequently changing components to prevent unnecessary re-renders
const MemoizedGallery = React.memo(Gallery);
const MemoizedInfo = React.memo(Info);
const MemoizedShipping = React.memo(Shipping);
const MemoizedComboStrip = React.memo(ComboStrip);
const MemoizedSimilarProducts = React.memo(SimilarProducts);
const MemoizedProductSpecs = React.memo(ProductSpecs);
const MemoizedProductDescription = React.memo(ProductDescription);
const MemoizedBuyBox = React.memo(BuyBox);

export default function ProductDetailPage({ showMessage }: Props) {
  const params = useParams();
  const slug = params.slug ?? '';
  const { loading, product, combos } = useProductDetail(slug);
  const { cart } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Initialize selected variant from localStorage (only on first render)
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    () => {
      const stored = localStorage.getItem(`lastVariant_${slug}`);
      return stored ? Number(stored) : null;
    }
  );

  // Save selected variant to localStorage when it changes
  useEffect(() => {
    if (selectedVariantId !== null) {
      localStorage.setItem(`lastVariant_${slug}`, selectedVariantId.toString());
    }
  }, [selectedVariantId, slug]);

  // Initialize or update variant and quantity based on product and cart data
  useEffect(() => {
    if (!product) return;

    // Only update variant if not set or invalid for current product
    if (
      selectedVariantId === null ||
      !product.variants?.some((v: any) => v.id === selectedVariantId)
    ) {
      const storedVariant = localStorage.getItem(`lastVariant_${slug}`);
      const validVariantIds = product.variants?.map((v: any) => v.id) || [];
      if (storedVariant && validVariantIds.includes(Number(storedVariant))) {
        setSelectedVariantId(Number(storedVariant));
      } else {
        const defaultVariant = product.variants?.[0]?.id ?? null;
        setSelectedVariantId(defaultVariant);
      }
    }

    // Update quantity from cart if available for current product and variant
    const currentVariantId = selectedVariantId ?? undefined;
    const cartItem = cart.find(
      (item) =>
        item.product_id === product.id &&
        (item.variant
          ? item.variant.id === currentVariantId
          : currentVariantId === undefined)
    );
    setQuantity(cartItem ? cartItem.quantity : 1);
  }, [product, cart]); // Removed selectedVariantId from deps to prevent feedback loop

  // Calculate price based on variant and pricing rules
  const { calculatedPrice, totalPrice } = useMemo(() => {
    if (!product) return { calculatedPrice: 0, totalPrice: 0 };

    let currentPrice = Number(product.base_price ?? 0);
    if (selectedVariantId) {
      const variant = product.variants?.find(
        (v: any) => v.id === selectedVariantId
      );
      if (variant) currentPrice = Number(variant.price);
    }

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

    return {
      calculatedPrice: currentPrice,
      totalPrice: currentPrice * quantity,
    };
  }, [product, selectedVariantId, quantity]);

  // Compute gallery data (images and variant map) only when product changes
  const galleryData = useMemo(() => {
    if (!product || !product.variants) {
      return {
        images: Array.isArray(product?.media)
          ? product.media.map((m: { url: string }) => m.url)
          : [],
        variantMap: {},
      };
    }

    const images: string[] = [];
    const variantMap: { [key: number]: number } = {};
    product.variants.forEach((variant: any, index: number) => {
      if (product.media?.[index]?.url) {
        images.push(product.media[index].url);
        variantMap[variant.id] = images.length - 1;
      }
    });

    return images.length > 0
      ? { images, variantMap }
      : {
          images: Array.isArray(product.media)
            ? product.media.map((m: { url: string }) => m.url)
            : [],
          variantMap: {},
        };
  }, [product]);

  // Conditional rendering during loading to avoid layout shifts
  if (loading && !product) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <EveryMartHeader />
        <main className="mx-auto w-full max-w-[1500px] px-4 lg:px-6 py-6 flex-1">
          <Spin tip="Loading product details..."/>
        </main>
        <Footer />
      </div>
    );
  }
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <EveryMartHeader />
      <main className="mx-auto w-full max-w-[1500px] px-4 lg:px-6 py-6 flex-1">
        <div
          className="grid gap-4 lg:grid-cols-[var(--left)_minmax(0,1fr)_var(--right)] items-start"
          style={{
            ['--left' as any]: `${L.leftWidth}px`,
            ['--right' as any]: `${L.rightWidth}px`,
          }}
        >
          {/* Critical components */}
          <div className="lg:col-start-1 lg:row-start-1 lg:self-stretch">
            <MemoizedGallery
              images={galleryData.images}
              variantMap={galleryData.variantMap}
              selectedVariantId={selectedVariantId}
              setSelectedVariantId={setSelectedVariantId}
              width={L.leftWidth}
              galleryHeight={L.galleryHeight}
              thumbHeight={L.thumbHeight}
              stickyTop={L.buyBoxStickyTop}
            />
          </div>
          <section className="lg:col-start-2 lg:row-start-1 space-y-4 min-w-0 self-start">
            <MemoizedInfo
              product={product}
              selectedVariantId={selectedVariantId}
              setSelectedVariantId={setSelectedVariantId}
              quantity={quantity}
              setQuantity={setQuantity}
              calculatedPrice={calculatedPrice}
            />
            <MemoizedShipping />
            <MemoizedComboStrip items={combos} />
            {/* Lazy-loaded components with fallback */}
            <Suspense fallback={<div>Loading similar products...</div>}>
              <LazySimilarProducts />
            </Suspense>
            <Suspense fallback={<div>Loading specs...</div>}>
              <MemoizedProductSpecs product={product} loading={loading} />
            </Suspense>
            <Suspense fallback={<div>Loading description...</div>}>
              <MemoizedProductDescription
                html={product?.short_description}
                loading={!product}
              />
            </Suspense>
          </section>
          <div className="lg:col-start-3 lg:row-span-2 lg:self-stretch">
            <div className="lg:sticky" style={{ top: L.buyBoxStickyTop }}>
              <MemoizedBuyBox
                product={product}
                selectedVariantId={selectedVariantId}
                quantity={quantity}
                setQuantity={setQuantity}
                calculatedPrice={calculatedPrice}
                totalPrice={totalPrice}
                width={L.rightWidth}
                minHeight={L.buyBoxMinHeight}
                showMessage={showMessage}
              />
            </div>
          </div>
          <div className="lg:col-start-1 lg:col-span-2 lg:row-start-2 space-y-4 self-start">
            <Suspense fallback={<div>Loading reviews...</div>}>
              <LazyProductReviews />
            </Suspense>
          </div>
          <div className="lg:col-span-3 mt-2">
            <Suspense fallback={<div>Loading more products...</div>}>
              <LazyExploreMore />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
  // return (
  //   <div className="min-h-screen flex flex-col bg-gray-50">
  //     <EveryMartHeader />
  //     <main className="mx-auto w-full max-w-[1500px] px-4 lg:px-6 py-6 flex-1">
  //       <div
  //         className="grid gap-4 lg:grid-cols-[var(--left)_minmax(0,1fr)_var(--right)] items-start"
  //         style={{
  //           ['--left' as any]: `${L.leftWidth}px`,
  //           ['--right' as any]: `${L.rightWidth}px`,
  //         }}
  //       >
  //         <div className="lg:col-start-1 lg:row-start-1 lg:self-stretch">
  //           <MemoizedGallery
  //             images={galleryData.images}
  //             variantMap={galleryData.variantMap}
  //             selectedVariantId={selectedVariantId}
  //             setSelectedVariantId={setSelectedVariantId}
  //             width={L.leftWidth}
  //             galleryHeight={L.galleryHeight}
  //             thumbHeight={L.thumbHeight}
  //             stickyTop={L.buyBoxStickyTop}
  //           />
  //         </div>

  //         <section className="lg:col-start-2 lg:row-start-1 space-y-4 min-w-0 self-start">
  //           <MemoizedInfo
  //             product={product}
  //             selectedVariantId={selectedVariantId}
  //             setSelectedVariantId={setSelectedVariantId}
  //             quantity={quantity}
  //             setQuantity={setQuantity}
  //             calculatedPrice={calculatedPrice}
  //           />
  //           <MemoizedShipping />
  //           <MemoizedComboStrip items={combos} />
  //           <MemoizedSimilarProducts />
  //           <MemoizedProductSpecs product={product} loading={loading} />
  //           <MemoizedProductDescription
  //             html={product?.short_description}
  //             loading={!product}
  //           />
  //         </section>

  //         <div className="lg:col-start-3 lg:row-span-2 lg:self-stretch">
  //           <div className="lg:sticky" style={{ top: L.buyBoxStickyTop }}>
  //             <MemoizedBuyBox
  //               product={product}
  //               selectedVariantId={selectedVariantId}
  //               quantity={quantity}
  //               setQuantity={setQuantity}
  //               calculatedPrice={calculatedPrice}
  //               totalPrice={totalPrice}
  //               width={L.rightWidth}
  //               minHeight={L.buyBoxMinHeight}
  //               showMessage={showMessage}
  //             />
  //           </div>
  //         </div>

  //         <div className="lg:col-start-1 lg:col-span-2 lg:row-start-2 space-y-4 self-start">
  //           <ProductReviews />
  //         </div>

  //         <div className="lg:col-span-3 mt-2">
  //           <ExploreMore />
  //         </div>
  //       </div>
  //     </main>
  //     <Footer />
  //   </div>
  // );
}
