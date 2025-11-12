import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { storeAffiliateData, AffiliateTrackingData } from '../../utils/affiliate-tracking';

export default function AffiliateLinkResolver() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;
  
  useEffect(() => {
    const run = async () => {
      const aff = searchParams.get('aff') || '';
      const variant = searchParams.get('variant') || '';
      const program = searchParams.get('program') || '';

      if (aff) {
        try {
          // Use the proper affiliate tracking system
          const trackingData: AffiliateTrackingData = {
            affiliateCode: aff,
            productId: id ? parseInt(id, 10) : undefined,
            variantId: variant ? parseInt(variant, 10) : undefined,
            programId: program ? parseInt(program, 10) : undefined,
            timestamp: Date.now(),
          };
          storeAffiliateData(trackingData);
          console.log('🔗 Affiliate data stored from resolver:', trackingData);
        } catch (error) {
          console.error('Error storing affiliate data:', error);
        }
      }
      if (!id) {
        navigate('/', { replace: true });
        return;
      }

      const res = await fetch(`${BE_BASE_URL}/products/${id}`);
      if (!res.ok) {
        navigate('/', { replace: true });
        return;
      }

      const json = await res.json();
      const slug = json?.data?.slug;
      if (!slug) {
        navigate('/', { replace: true });
        return;
      }

      const qs = new URLSearchParams();
      if (variant) qs.set('variant', variant);
      if (aff) qs.set('aff', aff);
      if (program) qs.set('program', program);

      navigate(
        `/products/slug/${slug}${qs.toString() ? `?${qs.toString()}` : ''}`,
        { replace: true }
      );
    };
    run();
  }, [id, navigate, searchParams]);

  return null;
}
