// frontend/src/app/page/AffiliateLinkResolver.tsx
import { useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

export default function AffiliateLinkResolver() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;
  
  useEffect(() => {
    const run = async () => {
      const aff = searchParams.get('aff') || '';
      const variant = searchParams.get('variant') || '';

      if (aff) {
        try {
          localStorage.setItem('affiliate_code', aff);
        } catch (error) {
          throw new Error(`error ` + error);
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

      navigate(
        `/products/slug/${slug}${qs.toString() ? `?${qs.toString()}` : ''}`,
        { replace: true }
      );
    };
    run();
  }, [id, navigate, searchParams]);

  return null;
}
