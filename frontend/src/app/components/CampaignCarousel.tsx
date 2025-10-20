// src/components/CampaignCarousel.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Carousel } from 'bootstrap';
import { getActiveCampaigns, Campaign } from '../../service/campaign.service';

type Slide = { imageUrl: string; alt?: string; href?: string };

const FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='1200' height='675'>
       <rect width='100%' height='100%' rx='16' fill='#F1F5F9'/>
       <text x='50%' y='50%' text-anchor='middle' dominant-baseline='middle'
             font-family='system-ui,Segoe UI,Roboto' font-size='18' fill='#94A3B8'>No image</text>
     </svg>`
  );

const CampaignCarousel: React.FC<{ id?: string; interval?: number }> = ({
  id = 'campaignCarousel',
  interval = 2000,
}) => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const campaigns: Campaign[] = await getActiveCampaigns();
        const now = Date.now(); // timestamp hiện tại

        const activeCampaigns = campaigns.filter((c) => {
          if (!c.starts_at || !c.ends_at) return false;
          const start = new Date(c.starts_at).getTime();
          const end = new Date(c.ends_at).getTime();
          return start <= now && now <= end;
        });

        const BACKEND_URL = 'http://localhost:3000'; // hoặc env
        const campaignSlides = activeCampaigns.map((c) => ({
          imageUrl: c.banner_url ? BACKEND_URL + c.banner_url : FALLBACK,
          alt: c.name,
          href: `/campaign/${c.id}`,
        }));

        setSlides(campaignSlides);
      } catch (err) {
        console.error('Lỗi fetch campaign:', err);
      }
    };
    fetchSlides();
  }, []);
  console.log('Slides:', slides);

  const normalized: Slide[] = useMemo(() => {
    if (slides.length === 0)
      return [{ imageUrl: FALLBACK, alt: 'Placeholder' }];
    return slides; // không nhân đôi
  }, [slides]);

  const pages = useMemo(() => {
    const out: Slide[][] = [];
    for (let i = 0; i < normalized.length; i += 2)
      out.push(normalized.slice(i, i + 2));
    return out;
  }, [normalized]);

  useEffect(() => {
  let instance: any;
  if (hostRef.current) {
    instance = Carousel.getOrCreateInstance(hostRef.current, {
      interval, // ⬅ sẽ dùng 3000ms
      pause: 'hover',
      touch: true,
      wrap: true,
    });
  }
  return () => instance?.dispose?.();
}, [interval, pages.length]);


  return (
    <div id={id} ref={hostRef} className="carousel slide" data-bs-ride="carousel">
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
              aria-label={`Slide ${i + 1}`}
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
                    <a href={s.href || '#'} aria-label={s.alt}>
                      <img
                        className="w-100"
                        style={{
                          aspectRatio: '16/9',
                          objectFit: 'cover',
                          borderRadius: 12,
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
};

export default CampaignCarousel;
