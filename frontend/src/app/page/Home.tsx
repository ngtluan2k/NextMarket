// src/pages/Home.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import EveryMartHeader from '../components/Navbar';
import CategoryNav from '../components/CategoryNav';
import 'bootstrap/dist/css/bootstrap.min.css';
import PromoShortcuts from '../components/PromoShortcuts';
import FlashSale from '../components/FlashSale';
import ProductGridToday from '../components/ProductGridToday';
import FeaturedBrands from '../components/FeaturedBrands';
import Footer from '../components/Footer';
import YouMayAlsoLike from '../components/YouMayAlsoLike';
import { fetchBrandsAPI } from '../../service/brand.service';
import { fetchCategoriesAPI, Category } from '../../service/category.service';


type Slide = { imageUrl: string; alt?: string; href?: string };

interface ToastMessage {
  showMessage?: (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => void;
}

function BootstrapTwoUpCarousel({
  id = 'hero2up',
  slides,
  interval = 5000,
}: {
  id?: string;
  slides?: Slide[];
  interval?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  const FALLBACK =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'>
         <rect width='100%' height='100%' rx='16' fill='#F1F5F9'/>
         <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
               font-family='system-ui,Segoe UI,Roboto' font-size='18' fill='#94A3B8'>No image</text>
       </svg>`
    );

  // Chuẩn hoá data: luôn có ít nhất 2 tấm ảnh để lên 1 trang (2-up)
  const normalized: Slide[] = React.useMemo(() => {
    const data = [...(slides ?? [])];
    if (data.length === 0) {
      return [
        { imageUrl: FALLBACK, alt: 'Placeholder 1' },
        { imageUrl: FALLBACK, alt: 'Placeholder 2' },
      ];
    }
    if (data.length === 1) data.push(data[0]);
    return data;
  }, [slides]);

  // Group 2 ảnh / trang
  const pages = useMemo(() => {
    const out: Slide[][] = [];
    for (let i = 0; i < normalized.length; i += 2)
      out.push(normalized.slice(i, i + 2));
    return out;
  }, [normalized]);

  // Bootstrap init
  useEffect(() => {
    let instance: any;
    (async () => {
      const { Carousel } = await import('bootstrap'); // ✅ có typings
      if (hostRef.current) {
        instance = Carousel.getOrCreateInstance(hostRef.current, {
          interval,
          pause: 'hover',
          touch: true,
          wrap: true,
        });
      }
    })();
    return () => instance?.dispose?.();
  }, [interval, pages.length]);

  return (
    <div
      id={id}
      ref={hostRef}
      className="carousel slide"
      data-bs-ride="carousel"
      data-bs-interval={interval}
      data-bs-pause="hover"
    >
      {pages.length > 1 && (
        <div className="carousel-indicators mb-2">
          {pages.map((_, i) => (
            <button
              key={i}
              type="button"
              data-bs-target={`#${id}`}
              data-bs-slide-to={i}
              className={i === 0 ? 'active' : ''}
              aria-current={i === 0 ? true : undefined}
              aria-label={`Trang ${i + 1}`}
            />
          ))}
        </div>
      )}

      <div className="carousel-inner">
        {pages.map((group, idx) => (
          <div
            key={idx}
            className={`carousel-item ${idx === 0 ? 'active' : ''}`}
          >
            <div className="container py-2">
              <div className="row g-3">
                {group.map((s, j) => (
                  <div key={j} className="col-12 col-lg-6">
                    <a
                      href={s.href || '#'}
                      aria-label={s.alt || `banner ${idx * 2 + j + 1}`}
                    >
                      <img
                        className="w-100"
                        style={{
                          aspectRatio: '16 / 9',
                          objectFit: 'cover',
                          borderRadius: 12,
                          display: 'block',
                        }}
                        src={s.imageUrl}
                        alt={s.alt || ''}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK;
                        }}
                      />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* arrows */}
      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target={`#${id}`}
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true" />
        <span className="visually-hidden">Previous</span>
      </button>
      <button
        className="carousel-control-next"
        type="button"
        data-bs-target={`#${id}`}
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true" />
        <span className="visually-hidden">Next</span>
      </button>
    </div>
  );
}

const Home: React.FC<ToastMessage> = ({ showMessage }) => {
  const [slidesState, setSlidesState] = useState<Slide[] | undefined>(
    undefined
  );
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchCategoriesAPI();
        setCategories(data);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);


  return (
    <div className="min-h-screen bg-slate-100">
      <EveryMartHeader />

      <main className="mx-auto max-w-screen-2xl px-4 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)] gap-6 mt-4">
          {/* Danh mục bên trái */}
          <aside className="lg:sticky lg:top-4 self-start">
            <CategoryNav />
          </aside>

          {/* Carousel bên phải */}
          <section>
            <div className="rounded-2xl bg-white shadow-xl ring-1 ring-slate-200 p-4">
              <BootstrapTwoUpCarousel slides={slidesState} interval={5000} />
            </div>
            <PromoShortcuts className="mt-4" />

           <FeaturedBrands fetchBrands={fetchBrandsAPI} className="mt-4"   />
            <YouMayAlsoLike className="mt-6" />
            <FlashSale className="mt-4" />
            <ProductGridToday
              containerClassName="my-6"
              cardClassName="hover:bg-gray-50"
            />
          </section>
        </div>
      </main>
      <Footer className="mt-12" />
    </div>
  );
};

export default Home;
