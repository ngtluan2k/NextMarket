import React, {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { useParams,useLocation  } from 'react-router-dom';
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
  const groupId = location.state?.groupId ||
    new URLSearchParams(location.search).get('groupId')
  const { loading, product, combos } = useProductDetail(slug);
  const { cart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(product?.base_price ?? 0);
  const [selectedType, setSelectedType] = useState<'bulk' | 'subscription' | 'normal' | undefined>(undefined);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(false);
  console.log('product in product detail page: ' + JSON.stringify(product));

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(
    () => {
      const stored = localStorage.getItem(`lastVariant_${slug}`);
      return stored ? Number(stored) : null;
    }
  );
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
        console.error('Failed to fetch reviews', err);
      } finally {
        setLoadingReviews(false);
      }
    },
    [product?.id] // dependency thật sự cần thiết
  );

  useEffect(() => {
    if (!product?.id) return;
    setReviews([]);
    setReviewPage(1);
    setHasMoreReviews(true);
    loadReviews(1, true);
  }, [product?.id, loadReviews]); // thêm loadReviews vào đây

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
    setQuantity(1); // mỗi lần product load lại
  }, [product]);

  const totalPrice = useMemo(
    () => calculatedPrice * quantity,
    [calculatedPrice, quantity]
  );

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
              setCalculatedPrice={setCalculatedPrice}
              maxQuantity={stock}
              selectedType={selectedType}
              setSelectedType={setSelectedType} 
            />
            <MemoizedShipping />
            <MemoizedComboStrip items={combos} />
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
                groupId={ groupId? Number(groupId) : null}
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
