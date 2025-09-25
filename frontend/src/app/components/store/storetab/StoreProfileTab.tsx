import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export type StoreProfileData = {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string | null;
  email?: string;
  phone?: string;
  status?: string;
  created_at?: string | null;
  updated_at?: string;
  storeInformation?: any[];
  storeIdentification?: any[];
  bankAccount?: any[];
  address?: any[];
  rating?: number;
  ratingCountText?: string;
  cancelRatePct?: number;
  returnRatePct?: number;
  memberSinceYear?: number;
  totalProducts?: number;
  followers?: number;
  chatResponse?: string;
};

type Props = {
  data?: StoreProfileData;
  fetchProfile?: (slug: string) => Promise<StoreProfileData>;
  className?: string;
};

async function defaultFetchProfile(slug: string): Promise<StoreProfileData> {
  const res = await fetch(`http://localhost:3000/stores/slug/${slug}/profile`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data;
}

const Icon = {
  calendar: (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-slate-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  box: (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-slate-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M21 16V8l-9-5-9 5v8l9 5 9-5z" />
      <path d="M3.3 7.3 12 12l8.7-4.7" />
      <path d="M12 22V12" />
    </svg>
  ),
  store: (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-slate-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M3 10h18l-1.2-5.9A2 2 0 0 0 17.9 2H6.1A2 2 0 0 0 4.2 4.1L3 10Z" />
      <path d="M4 10v9a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-9" />
      <path d="M9 22v-6h6v6" />
    </svg>
  ),
  starStroke: (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-slate-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="m12 2 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.8 6.1 20l1.2-6.5L2.5 8.9l6.6-.9L12 2z" />
    </svg>
  ),
  users: (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-slate-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.9" />
      <path d="M16 3.1a4 4 0 0 1 0 7.8" />
    </svg>
  ),
  chat: (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5 text-slate-500"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  ),
  infoDot: <span className="text-slate-400">ⓘ</span>,
};

const Row = ({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children?: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 px-5 py-3">
    <div className="shrink-0">{icon}</div>
    <div className="flex-1 flex items-center justify-between">
      <div className="text-[13px] text-slate-500">{label}</div>
      <div className="text-[15px] font-medium text-slate-900">
        {children ?? '—'}
      </div>
    </div>
  </div>
);

export default function StoreProfileTab({
  data,
  fetchProfile,
  className,
}: Props) {
  const { slug = '' } = useParams();
  const [info, setInfo] = useState<StoreProfileData | undefined>(data);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (data) {
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const fetched = await (fetchProfile ?? defaultFetchProfile)(slug);
        if (!alive) return;
        console.log('Fetched store profile:', fetched);
        setInfo(fetched);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug, data, fetchProfile]);

  const fmt = new Intl.NumberFormat('vi-VN');
  const cancelRate = Math.round(info?.cancelRatePct ?? 0);
  const returnRate = Math.round(info?.returnRatePct ?? 0);

  return (
    <section
      className={['mx-auto mt-3 max-w-[1300px]', className || ''].join(' ')}
    >
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-[400px_auto] gap-6">
            {/* LEFT */}
            <div className="flex items-center justify-center">
              <div className="grid grid-cols-[1fr_auto_1fr] w-full text-center">
                <div>
                  <div className="text-[16px] font-medium text-slate-900">
                    Tỉ lệ huỷ {Icon.infoDot}
                  </div>
                  <div className="text-[36px] font-semibold leading-none text-emerald-600">
                    {cancelRate} %
                  </div>
                </div>
                <div className="w-px bg-slate-200" />
                <div>
                  <div className="text-[16px] font-medium text-slate-900">
                    Tỉ lệ đổi trả {Icon.infoDot}
                  </div>
                  <div className="text-[36px] font-semibold leading-none text-emerald-600">
                    {returnRate} %
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="border-t border-slate-200 md:border-t-0 md:border-l">
              <Row icon={Icon.calendar} label="Thành viên từ năm">
                {info?.created_at
                  ? new Date(info.created_at).toLocaleDateString('vi-VN')
                  : '—'}
              </Row>
              <Row icon={Icon.box} label="Sản phẩm">
                {typeof info?.totalProducts === 'number'
                  ? `${fmt.format(info.totalProducts)}+`
                  : '—'}
              </Row>
              <Row icon={Icon.store} label="Mô tả của hàng">
                {info?.description || '—'}
              </Row>
              <Row icon={Icon.starStroke} label="Đánh giá">
                {typeof info?.rating === 'number'
                  ? `${info.rating.toFixed(1)} / 5`
                  : '—'}
              </Row>
              <Row icon={Icon.users} label="Người theo dõi">
                {typeof info?.followers === 'number'
                  ? `${fmt.format(info.followers)}+`
                  : '—'}
              </Row>
              <Row icon={Icon.chat} label="Phản hồi Chat">
                {info?.chatResponse || '—'}
              </Row>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
