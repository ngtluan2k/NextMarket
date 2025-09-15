import { fetchCategoriesAPI } from "../../service/category.service";
import { fetchPairPromosAPI } from "../../service/pairPromos.service";
import Breadcrumb from "../components/Breadcrumb";
import CategorySidebar from "../components/CategorySidebar";
import ExploreCategories from "../components/ExploreCategories";
import Footer from "../components/Footer";
import EveryMartHeader from "../components/Navbar";
import PairPromoCarousel from "../components/PairPromoCarousel";
import ProductGrid from "../components/products/ProductGrid";


import { useCategoryBreadcrumbs } from "../hooks/useCategoryBreadcrumbs";

const CategoryPage: React.FC = () => {
  const crumbs = useCategoryBreadcrumbs();
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Header */}
        <EveryMartHeader />
  
        {/* Nội dung trang danh mục sẽ code sau */}
        <main className="flex-1 mx-auto w-full max-w-screen-2xl px-4 py-6">
        <Breadcrumb items={crumbs} className="mb-4" />
      
          <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3">
          <CategorySidebar        
              fetchCategories={fetchCategoriesAPI}
              className="sticky top-4"
              onSelect={(node) => console.log("Bạn chọn:", node)}
            />
          </div>
          

          <section className="col-span-12 lg:col-span-9">
            <div className="mb-3 rounded-xl bg-white ring-1 ring-black/5 shadow px-3 py-3">
              <h1 className="text-lg md:text-xl font-semibold tracking-tight text-slate-900">
                Nhà Sách Tiki
              </h1>
            </div>
            {/* ✅ 2-card carousel đúng kích thước như ảnh */}
            <PairPromoCarousel
              fetchItems={fetchPairPromosAPI}
              className="mb-4"
              autoPlay
              interval={6000}
            />
             <ExploreCategories/>
             <ProductGrid/>
            </section>
             
            
          </div>
          
        </main>
  
        {/* Footer */}
        <Footer />
      </div>
    );
  };
  
  export default CategoryPage;