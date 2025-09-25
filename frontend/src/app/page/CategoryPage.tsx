import React, { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { fetchPairPromosAPI } from '../../service/pairPromos.service';
import { getCategoryBySlug } from '../../service/category.service';
import Breadcrumb from '../components/Breadcrumb';
import CategorySidebar from '../components/CategorySidebar';
import ExploreCategories, {
  ExploreItem,
} from '../components/ExploreCategories';
import Footer from '../components/Footer';
import EveryMartHeader from '../components/Navbar';
import PairPromoCarousel from '../components/PairPromoCarousel';
import ProductList from '../components/ProductList';
import { useCategoryBreadcrumbs } from '../hooks/useCategoryBreadcrumbs';
import { fetchBrandsByCategory } from '../../service/category.service';
import ExploreBrands from '../components/ExploreBrands';

interface LocationState {
  title?: string;
}

const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const state = location.state as LocationState;
  const [title, setTitle] = useState(state?.title || '');
  const [selectedBrandIds, setSelectedBrandIds] = useState<number[]>([]);

  const crumbs = useCategoryBreadcrumbs(
    title ? { slug: slug!, name: title } : undefined
  );

  // Update title khi slug thay đổi
  useEffect(() => {
    if (!state?.title && slug) {
      const fetchCategory = async () => {
        try {
          const cat = await getCategoryBySlug(slug);
          setTitle(cat.name);
        } catch (err) {
          setTitle(slug.replace(/-/g, ' '));
        }
      };
      fetchCategory();
    } else if (state?.title) {
      setTitle(state.title);
    }
  }, [slug, state]);

  // Xử lý chọn brand (toggle highlight)
  const handleSelectBrand = (item: ExploreItem) => {
    const id = Number(item.id);
    setSelectedBrandIds(
      (prev) =>
        prev.includes(id)
          ? prev.filter((x) => x !== id) // bỏ nếu đã chọn
          : [...prev, id] // thêm nếu chưa chọn
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <EveryMartHeader />

      <main className="flex-1 mx-auto w-full max-w-screen-2xl px-4 py-6">
       <Breadcrumb
  items={crumbs}
  className="mb-4"
  onItemClick={(crumb) => {
    if (crumb.name) {
      setTitle(crumb.name); // luôn lấy name từ crumb
    } else {
      setTitle(crumb.label);
    }
  }}
/>


        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">
            <CategorySidebar
              fetchAllCategories={async () => {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:3000/categories', {
                  headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                return json.data;
              }}
            />
          </div>

          <section className="col-span-12 lg:col-span-9 space-y-4">
            <div className="rounded-xl bg-white ring-1 ring-black/5 shadow px-3 py-3">
              <h1 className="text-lg md:text-4xl font-semibold tracking-tight text-slate-900">
                {title || 'Danh mục sản phẩm'}
              </h1>
            </div>

            <PairPromoCarousel
              fetchItems={fetchPairPromosAPI}
              className="mb-4"
              autoPlay
              interval={6000}
            />

            <ExploreCategories
              title="Tất cả sản phẩm"
              fetchItems={async () => {
                const brands = await fetchBrandsByCategory(slug!);
                return brands.map((b) => ({
                  id: b.id,
                  name: b.name,
                  logo_url: '', // bỏ hình
                }));
              }}
              onSelect={handleSelectBrand}
              selectedIds={selectedBrandIds} // highlight brand đang chọn
            />

            <ProductList
              title={`Sản phẩm trong ${title}`}
              slug={slug}
              brandIds={selectedBrandIds} // lọc sản phẩm theo brand
            />
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CategoryPage;