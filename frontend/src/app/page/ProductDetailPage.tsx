import React, { useEffect, useMemo, useState } from 'react';
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

interface Props {
  showMessage?: (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => void;
}

export default function ProductDetailPage({ showMessage }: Props) {
  const params = useParams();
  const slug = params.slug ?? '';
  const { loading, product, combos } = useProductDetail(slug);
  const { cart } = useCart();
  const [quantity, setQuantity] = useState(1);

  console.log("current product : " + JSON.stringify(product))

  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(() => {
    const stored = localStorage.getItem(`lastVariant_${slug}`);
    return stored ? Number(stored) : null;
  });

  useEffect(() => {
    if (selectedVariantId !== null) {
      localStorage.setItem(`lastVariant_${slug}`, selectedVariantId.toString());
    }
  }, [selectedVariantId, slug]);

  useEffect(() => {
    if (!product) return;

    const storedVariant = localStorage.getItem(`lastVariant_${slug}`);
    const validVariantIds = product.variants?.map((v: any) => v.id) || [];
    if (!storedVariant || !validVariantIds.includes(Number(storedVariant))) {
      const defaultVariant = product.variants?.[0]?.id ?? null;
      setSelectedVariantId(defaultVariant);
    }

    const currentVariantId = selectedVariantId ?? undefined;
    const cartItem = cart.find(
      (item) =>
        item.product_id === product.id &&
        (item.variant
          ? item.variant.id === currentVariantId
          : currentVariantId === undefined)
    );

    if (cartItem) {
      setQuantity(cartItem.quantity);
    } else {
      setQuantity(1);
    }
  }, [product, selectedVariantId, cart, slug]);

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

    if (images.length === 0) {
      return {
        images: Array.isArray(product.media)
          ? product.media.map((m: { url: string }) => m.url)
          : [],
        variantMap: {},
      };
    }

    return { images, variantMap };
  }, [product]);

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
            <div className="lg:col-start-1 lg:row-start-1 lg:self-stretch">
              <Gallery
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
              <Info
                product={product}
                selectedVariantId={selectedVariantId}
                setSelectedVariantId={setSelectedVariantId}
                quantity={quantity}
                setQuantity={setQuantity}
                calculatedPrice={calculatedPrice}
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

            <div className="lg:col-start-3 lg:row-span-2 lg:self-stretch">
              <div className="lg:sticky" style={{ top: L.buyBoxStickyTop }}>
                <BuyBox
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