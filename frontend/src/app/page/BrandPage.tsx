// src/app/page/BrandPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { fetchPairPromosAPI } from '../../service/pairPromos.service';
import {
  getBrandById,
  fetchCategoriesByBrandProducts,
} from '../../service/brand.service';
import Breadcrumb from '../components/Breadcrumb';
import ExploreCategories, {
  ExploreItem,
} from '../components/ExploreCategories';
import Footer from '../components/Footer';
import EveryMartHeader from '../components/Navbar';
import PairPromoCarousel from '../components/PairPromoCarousel';
import ProductListByBrand from '../components/ProductListByBrand';
import { useBrandBreadcrumbs } from '../hooks/useBrandBreadcrumbs';
import ExploreBrands from '../components/ExploreBrands';

interface LocationState {
  title?: string;
}

const BrandPage: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const location = useLocation();
  const state = location.state as LocationState;
  const [title, setTitle] = useState(state?.title || '');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  const crumbs = useBrandBreadcrumbs(
    title ? { id: Number(brandId), name: title } : undefined
  );

  // Lấy brand name
  useEffect(() => {
    if (!state?.title && brandId) {
      const fetchBrand = async () => {
        try {
          const brand = await getBrandById(Number(brandId));
          setTitle(brand.name);
        } catch (err) {
          setTitle(`Brand ${brandId}`);
        }
      };
      fetchBrand();
    } else if (state?.title) {
      setTitle(state.title);
    }
  }, [brandId, state]);

  // Toggle chọn category
  const handleSelectCategory = (item: ExploreItem) => {
    const id = Number(item.id);
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EveryMartHeader />

      <main className="flex-1 mx-auto w-full max-w-screen-2xl px-4 py-6">
        <Breadcrumb items={crumbs} className="mb-4" />

        <section className="space-y-4">
          {/* Tiêu đề thương hiệu */}
          <div className="rounded-xl bg-white ring-1 ring-black/5 shadow px-3 py-3">
            <h1 className="text-lg md:text-4xl font-semibold tracking-tight text-slate-900">
              {title || 'Thương hiệu'}
            </h1>
          </div>

          {/* Banner khuyến mãi */}
          <PairPromoCarousel
            fetchItems={fetchPairPromosAPI}
            className="mb-4"
            autoPlay
            interval={6000}
          />

          {/* Bộ lọc category */}
          <ExploreBrands
            title="Danh mục sản phẩm"
            fetchItems={() => fetchCategoriesByBrandProducts(Number(brandId))}
            selectedIds={selectedCategoryIds}
            onSelect={(c) => {
              const id = Number(c.id);
              setSelectedCategoryIds((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
              );
            }}
          />

          {/* Danh sách sản phẩm */}
          <ProductListByBrand
            title={`Sản phẩm của ${title}`}
            brandIds={[Number(brandId)]}
            categoryIds={selectedCategoryIds}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BrandPage;
