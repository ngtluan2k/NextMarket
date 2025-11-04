import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import StoreHeroCarousel from '../StoreHeroCarousel';
import StoreBestSellers from '../StoreBestSellers';
import StoreFlashDeals from '../StoreFlashDeals';
import StoreProductsGrid from '../StoreProductsGrid';

export default function StoreHomeTab() {
  const { slug = '' } = useParams();

  const [slides, setSlides] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [flashDeals, setFlashDeals] = useState([]);
  const [endsAt, setEndsAt] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [banners, best, flash] = await Promise.all([
          fetch(`/api/stores/${slug}/banners`).then((r) => r.json()),
          fetch(`/api/stores/${slug}/best-sellers`).then((r) => r.json()),
          fetch(`/api/stores/${slug}/flash-deals`).then((r) => r.json()),
        ]);

        setSlides(banners || []);
        setBestSellers(best || []);
        setFlashDeals(flash.items || []);
        setEndsAt(flash.endsAt);
      } catch (err) {
        console.error('❌ StoreHomeTab load failed:', err);
        setSlides([]);
        setBestSellers([]);
        setFlashDeals([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-500 animate-pulse">
        Đang tải dữ liệu cửa hàng...
      </div>
    );
  }

  return (
    <>
      <StoreHeroCarousel slides={slides} loading={false} />
      <StoreBestSellers storeSlug={slug} items={bestSellers} />
      <div className="mt-3">
        <StoreFlashDeals storeSlug={slug} endsAt={endsAt} items={flashDeals} />
      </div>
      <div className="mt-3">
        <StoreProductsGrid storeSlug={slug} pageSize={20} />
      </div>
    </>
  );
}
