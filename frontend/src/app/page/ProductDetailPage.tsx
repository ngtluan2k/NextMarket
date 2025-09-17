import React from "react";
import { useParams } from "react-router-dom";
import EveryMartHeader from "../components/Navbar";
import Footer from "../components/Footer";
import { useProductDetail } from "../hooks/useProductDetail";
import { PRODUCT_DETAIL_LAYOUT as L } from "../components/productDetail/productDetail";
import { Gallery, Info, Shipping, ComboStrip, BuyBox } from "../components/productDetail";
import SimilarProducts from "../components/productDetail/SimilarProducts";
import ProductSpecs from "../components/productDetail/ProductSpecs";
import ProductDescription from "../components/productDetail/ProductDescription";
import ProductReviews from "../components/productDetail/ProductReviews";

export default function ProductDetailPage() {
  const params = useParams();
  const id = (params as any)?.id ?? "";
  const { loading, product, combos } = useProductDetail(id);

  return (
    <>
      <EveryMartHeader />
      <main className="bg-slate-50 px-4 py-6">
        <div className="mx-auto" style={{ maxWidth: L.container }}>
          <div
            className="grid grid-cols-1 gap-4 lg:grid-cols-[var(--left)_minmax(0,1fr)_var(--right)]"
            style={{ ["--left" as any]: `${L.leftWidth}px`, ["--right" as any]: `${L.rightWidth}px` }}
          >
            {/* KHUNG TRÁI */}
            <Gallery
              images={product?.images}
              width={L.leftWidth}
              galleryHeight={L.galleryHeight}
              thumbHeight={L.thumbHeight}
              stickyTop={L.buyBoxStickyTop}
            />

            {/* KHUNG GIỮA */}
            <section className="space-y-4">
              <Info product={product} />
              <Shipping />
              <ComboStrip items={combos} />
              <SimilarProducts />
              <ProductSpecs />
              <ProductDescription />
            </section>

            {/* KHUNG PHẢI */}
            <BuyBox
              product={product}
              width={L.rightWidth}
              minHeight={L.buyBoxMinHeight}
              stickyTop={L.buyBoxStickyTop}
            />
            <div className="lg:col-span-2 space-y-4 " >
              <ProductReviews />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
