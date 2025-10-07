import { useParams } from 'react-router-dom';
import StoreBestSellers from '../StoreBestSellers';
import StoreProductsGrid from '../StoreProductsGrid';
import StoreFlashDeals from '../StoreFlashDeals';

import { useEffect, useState } from 'react';
import StoreHeroCarousel, { StoreSlide } from '../StoreHeroCarousel';

export default function StoreHomeTab() {
  const { slug = '' } = useParams();
  const [slides, setSlides] = useState<StoreSlide[]>([]);
  const [loadingSlides, setLoadingSlides] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoadingSlides(true);

        const res = await fetch(`/api/stores/${slug}/banners`);
        const data = await res.json();
        setSlides(data);
      } catch {
        setSlides([]);
      } finally {
        setLoadingSlides(false);
      }
    })();
  }, [slug]);

  return (
    <>
      <StoreHeroCarousel slides={slides} loading={loadingSlides} />
      <StoreBestSellers storeSlug={slug} />
      <div className="mt-3">
        <StoreFlashDeals storeSlug={slug} />
      </div>
      <div className="mt-3">
        <StoreProductsGrid storeSlug={slug} pageSize={20} />
      </div>
    </>
  );
}
