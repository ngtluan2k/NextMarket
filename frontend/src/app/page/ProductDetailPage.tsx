import React, {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { useParams, useLocation } from 'react-router-dom';
import EveryMartHeader from '../components/Navbar';
import Footer from '../components/Footer';
import { useProductDetail } from '../hooks/useProductDetail';
import { PRODUCT_DETAIL_LAYOUT as L } from '../types/productDetail';
import ProductDescription from '../components/productDetail/ProductDescription';
import ProductSpecs from '../components/productDetail/ProductSpecs';
import BuyBox from '../components/productDetail/BuyBox';
import { useCart } from '../context/CartContext';
import { Spin } from 'antd';
import {
  Gallery,
  Info,
  Shipping,
  ComboStrip,
} from '../components/productDetail';
import { VariantInfo } from '../types/product';
import { fetchProductReviews, Review } from '../../service/product_review';
import GroupOrderInfoBar from '../components/group_orders/components/GroupOrderInfoBar';
import { initializeAffiliateTracking } from '../../utils/affiliate-tracking';

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

const MemoizedGallery = React.memo(Gallery);
const MemoizedInfo = React.memo(Info);
const MemoizedShipping = React.memo(Shipping);
const MemoizedComboStrip = React.memo(ComboStrip);
const MemoizedProductSpecs = React.memo(ProductSpecs);
const MemoizedProductDescription = React.memo(ProductDescription);
const MemoizedBuyBox = React.memo(BuyBox);

export default function ProductDetailPage({ showMessage }: Props) {
  const params = useParams();
  const location = useLocation();
  const slug = params.slug ?? '';
  const groupId =
    location.state?.groupId ||
    new URLSearchParams(location.search).get('groupId');
  const { loading, product, combos } = useProductDetail(slug);
  const { cart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(
    product?.base_price ?? 0
  );
  const [selectedType, setSelectedType] = useState<
    'bulk' | 'subscription' | 'normal' | 'flash_sale' | undefined
  >(undefined);
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    () => {
      // First check URL parameters (from affiliate links)
      const urlParams = new URLSearchParams(location.search);
      const variantFromUrl = urlParams.get('variant');
      if (variantFromUrl) {
        return Number(variantFromUrl);
      }
      
      // Fallback to localStorage
      const stored = localStorage.getItem(`lastVariant_${slug}`);
      return stored ? Number(stored) : null;
    }
  );

  // Effect to handle URL parameter changes (from affiliate links)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const variantFromUrl = urlParams.get('variant');
    
    if (variantFromUrl && product?.variants?.length) {
      const variantId = Number(variantFromUrl);
      const variantExists = product.variants.some(
        (v: VariantInfo) => v.id === variantId
      );
      
      if (variantExists && variantId !== selectedVariantId) {
        setSelectedVariantId(variantId);
        console.log(' Variant selected from affiliate link:', variantId);
      }
    }
  }, [location.search, product?.variants, selectedVariantId]);

  useEffect(() => {
    // console.log(
    //   '📦 [ProductDetailPage] selectedRuleId thay đổi:',
    //   selectedRuleId
    // );
  }, [selectedRuleId]);

  useEffect(() => {
    if (!product?.variants?.length) return;

    const exists = product.variants?.some(
      (v: VariantInfo) => v.id === selectedVariantId
    );

    if (!exists) {
      if (product.variants.length === 1) {
        setSelectedVariantId(product.variants[0].id);
      } else {
        setSelectedVariantId(null);
      }
    }
  }, [product, selectedVariantId]);

  const stock = useMemo(() => {
    const v = product?.variants?.find(
      (v: VariantInfo) => v.id === selectedVariantId
    );
    return v?.stock ?? 0;
  }, [product, selectedVariantId]);

  const loadReviews = useCallback(
    async (page = reviewPage, reset = false) => {
      if (!product?.id) return;
      try {
        setLoadingReviews(true);
        const data = await fetchProductReviews(product.id, page, 5);
        if (reset) {
          setReviews(data.data);
        } else {
          setReviews((prev) => [...prev, ...data.data]);
        }
        setHasMoreReviews(data.data.length === 5);
        setReviewPage(page);
      } catch (err) {
        // console.error('Failed to fetch reviews', err);
      } finally {
        setLoadingReviews(false);
      }
    },
    [product?.id]
  );

  useEffect(() => {
    if (!product?.id) return;
    setReviews([]);
    setReviewPage(1);
    setHasMoreReviews(true);
    loadReviews(1, true);
  }, [product?.id, loadReviews]);

  useEffect(() => {
    if (quantity > stock) setQuantity(stock || 1);
  }, [stock, quantity]);

  useEffect(() => {
    if (selectedVariantId !== null) {
      localStorage.setItem(`lastVariant_${slug}`, selectedVariantId.toString());
    }
  }, [selectedVariantId, slug]);

  useEffect(() => {
    if (!product) return;
    setQuantity(1);
  }, [product]);

  // Initialize affiliate tracking on product page load
  useEffect(() => {
    initializeAffiliateTracking();
    // console.log('🔗 Affiliate tracking initialized on product page');
  }, []);

  const totalPrice = useMemo(
    () => calculatedPrice * quantity,
    [calculatedPrice, quantity]
  );

 const galleryData = useMemo(() => {
  if (!product) return { images: [], imageToVariantMap: {}, variantImageIndices: {} };

  const allImages: string[] = [];
  const imageToVariantMap: Record<string, number> = {}; // Map image URL to variant ID
  const variantImageIndices: Record<number, number[]> = {}; // Map variant ID to array of image indices
  const seenUrls = new Set<string>();

  // Add product-level media first
  if (product.media?.length) {
    product.media.forEach((m: any) => {
      if (m.url && !seenUrls.has(m.url)) {
        allImages.push(m.url);
        seenUrls.add(m.url);
      }
    });
  }

  // Add all variant media
  if (product.variants?.length) {
    product.variants.forEach((variant: any) => {
      if (variant.media?.length) {
        variantImageIndices[variant.id] = [];
        
        variant.media.forEach((m: any) => {
          if (m.url && !seenUrls.has(m.url)) {
            const index = allImages.length;
            allImages.push(m.url);
            seenUrls.add(m.url);
            imageToVariantMap[m.url] = variant.id;
            variantImageIndices[variant.id].push(index);
          }
        });
      }
    });
  }

  return { images: allImages, imageToVariantMap, variantImageIndices };
}, [product]);

  // Handle image click to select variant
  const handleImageClick = useCallback((imageUrl: string) => {
    const variantId = galleryData.imageToVariantMap[imageUrl];
    if (variantId) {
      setSelectedVariantId(variantId);
    }
  }, [galleryData.imageToVariantMap]);

  // Handle variant name click to highlight first image of that variant
  const handleVariantNameClick = useCallback((variantId: number) => {
    const imageIndices = galleryData.variantImageIndices[variantId];
    if (imageIndices && imageIndices.length > 0) {
      // Scroll to first image of this variant
      setGalleryScrollIndex(imageIndices[0]);
    }
  }, [galleryData.variantImageIndices]);

  const [galleryScrollIndex, setGalleryScrollIndex] = useState<number | null>(null);

  if (loading && !product) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <EveryMartHeader />
        <main className="mx-auto w-full max-w-[1500px] px-4 lg:px-6 py-6 flex-1">
          <Spin>Loading product details...</Spin>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <EveryMartHeader />
      {/* Thêm GroupOrderInfoBar khi có groupId */}
      {groupId && <GroupOrderInfoBar groupId={Number(groupId)} />}
      <main className="mx-auto w-full max-w-[1500px] px-4 lg:px-6 py-6 flex-1">
        <div
          className="grid gap-4 lg:grid-cols-[var(--left)_minmax(0,1fr)_var(--right)] items-start"
          style={{
            ['--left' as any]: `${L.leftWidth}px`,
            ['--right' as any]: `${L.rightWidth}px`,
          }}
        >
          <div className="lg:col-start-1 lg:row-start-1 lg:self-stretch">
            <MemoizedGallery
              images={galleryData.images}
              imageToVariantMap={galleryData.imageToVariantMap}
              onImageClick={handleImageClick}
              scrollToIndex={galleryScrollIndex}
              onScrollIndexUsed={() => setGalleryScrollIndex(null)}
              width={L.leftWidth}
              galleryHeight={L.galleryHeight}
              thumbHeight={L.thumbHeight}
              stickyTop={L.buyBoxStickyTop}
            />
            {/* Display selected variant name */}
            {selectedVariantId && product?.variants?.length && (
              <div className="mt-3 rounded-lg bg-white p-3 ring-1 ring-slate-200">
                <p className="text-sm text-slate-600">Phiên bản được chọn:</p>
                <p className="font-semibold text-slate-900">
                  {product.variants.find((v: any) => v.id === selectedVariantId)?.variant_name || 'N/A'}
                </p>
              </div>
            )}
          </div>
          <section className="lg:col-start-2 lg:row-start-1 space-y-4 min-w-0 self-start">
            <MemoizedInfo
              product={product}
              selectedVariantId={selectedVariantId}
              setSelectedVariantId={setSelectedVariantId}
              onVariantNameClick={handleVariantNameClick}
              quantity={quantity}
              setQuantity={setQuantity}
              calculatedPrice={calculatedPrice}
              setCalculatedPrice={setCalculatedPrice}
              maxQuantity={stock}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              selectedRuleId={selectedRuleId}
              setSelectedRuleId={setSelectedRuleId}
            />
            <MemoizedShipping />
            {/* Sửa cách truyền props vào ComboStrip */}
            <MemoizedComboStrip
              storeId={product?.store?.id}
              productId={product?.id}
            />
            <Suspense fallback={<div>Loading similar products...</div>}>
              <LazySimilarProducts productId={product.id} />
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
                maxQuantity={stock}
                setQuantity={setQuantity}
                calculatedPrice={calculatedPrice}
                totalPrice={totalPrice}
                width={L.rightWidth}
                minHeight={L.buyBoxMinHeight}
                showMessage={showMessage}
                selectedType={selectedType}
                groupId={groupId ? Number(groupId) : null}
                selectedRuleId={selectedRuleId}
              />
            </div>
          </div>
          <div className="lg:col-start-1 lg:col-span-2 lg:row-start-2 space-y-4 self-start">
            <Suspense fallback={<div>Loading reviews...</div>}>
              <LazyProductReviews productId={product.id} />
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
}
