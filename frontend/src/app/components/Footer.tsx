// src/components/Footer.tsx
import React, { useEffect, useState } from 'react';

export type FooterLink = { label: string; href: string };
export type FooterColumn = { title: string; links: FooterLink[] };

export type Social = {
  name: 'facebook' | 'youtube' | 'tiktok' | 'instagram';
  href: string;
};

export type FooterData = {
  columns?: FooterColumn[];
  socials?: Social[];
  paymentTags?: string[]; // ví dụ ["VNPAY", "MOMO", "VISA", "MASTERCARD", "COD", "ZaloPay"]
  shippingTags?: string[]; // ví dụ ["GHN", "GHTK", "VNPost", "Viettel Post"]
  appBadges?: { label: string; href: string }[]; // ví dụ [{label: "App Store", href:"#"}, ...]
  bottomLinks?: FooterLink[]; // ví dụ ["Chính sách bảo mật", ...]
  copyright?: string;
};

type Props = {
  className?: string;
  data?: FooterData; // nếu đã có sẵn data
  fetchFooter?: () => Promise<FooterData>; // lấy từ API
};

const DEFAULT_DATA: FooterData = {
  columns: [
    {
      title: 'Hỗ trợ khách hàng',
      links: [
        { label: 'Trung tâm trợ giúp', href: '#' },
        { label: 'Hướng dẫn mua hàng', href: '#' },
        { label: 'Thanh toán & vận chuyển', href: '#' },
        { label: 'Đổi trả & hoàn tiền', href: '#' },
      ],
    },
    {
      title: 'Về EveryMart',
      links: [
        { label: 'Giới thiệu', href: '#' },
        { label: 'Tuyển dụng', href: '#' },
        { label: 'Điều khoản sử dụng', href: '#' },
        { label: 'Chính sách bảo mật', href: '#' },
      ],
    },
    {
      title: 'Hợp tác & Liên kết',
      links: [
        { label: 'Bán hàng cùng EveryMart', href: '#' },
        { label: 'Quảng cáo thương hiệu', href: '#' },
        { label: 'Liên hệ đối tác', href: '#' },
      ],
    },
  ],
  socials: [
    { name: 'facebook', href: '#' },
    { name: 'youtube', href: '#' },
    { name: 'tiktok', href: '#' },
    { name: 'instagram', href: '#' },
  ],
  paymentTags: ['VISA', 'MASTERCARD', 'VNPAY', 'MOMO', 'ZaloPay', 'COD'],
  shippingTags: ['GHN', 'GHTK', 'VNPost', 'Viettel Post'],
  appBadges: [
    { label: 'App Store', href: '#' },
    { label: 'Google Play', href: '#' },
  ],
  bottomLinks: [
    { label: 'Chính sách bảo mật', href: '#' },
    { label: 'Điều khoản sử dụng', href: '#' },
    { label: 'Giải quyết khiếu nại', href: '#' },
  ],
  copyright: '© 2025 EveryMart. All rights reserved.',
};

export default function Footer({ className = '', data, fetchFooter }: Props) {
  const [store, setStore] = useState<FooterData>(data ?? DEFAULT_DATA);

  useEffect(() => {
    let aborted = false;
    (async () => {
      if (!fetchFooter) return;
      try {
        const res = await fetchFooter();
        if (!aborted && res) setStore((prev) => ({ ...prev, ...res }));
      } catch {
        // im lặng fallback mặc định
      }
    })();
    return () => {
      aborted = true;
    };
  }, [fetchFooter]);

  const columns = store.columns ?? [];
  const socials = store.socials ?? [];
  const payments = store.paymentTags ?? [];
  const shippings = store.shippingTags ?? [];
  const badges = store.appBadges ?? [];
  const bottomLinks = store.bottomLinks ?? [];

  return (
    <footer className={`bg-white/90 ring-1 ring-slate-200 ${className}`}>
      <div className="mx-auto max-w-screen-2xl px-3 sm:px-4">
        {/* Top columns */}
        <div className="grid gap-6 py-6 sm:gap-8 sm:py-8 md:grid-cols-2 lg:grid-cols-4">
          {columns.map((col, i) => (
            <div key={i} className="text-center sm:text-left">
              <h4 className="mb-2 sm:mb-3 text-sm font-bold text-slate-900">
                {col.title}
              </h4>
              <ul className="space-y-1 sm:space-y-2">
                {col.links.map((l, idx) => (
                  <li key={idx}>
                    <a
                      href={l.href}
                      className="text-xs text-slate-700 hover:text-slate-900 hover:underline"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Socials + App badges gộp thành 1 cột */}
          <div className="md:col-span-2 lg:col-span-1 text-center sm:text-left">
            <h4 className="mb-2 sm:mb-3 text-sm font-bold text-slate-900">
              Kết nối với chúng tôi
            </h4>
            <div className="flex justify-center sm:justify-start items-center gap-2 sm:gap-3 mb-4 sm:mb-0">
              {socials.map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  aria-label={s.name}
                  className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200 hover:bg-slate-200 transition-colors"
                >
                  <SocialIcon name={s.name} />
                </a>
              ))}
            </div>

            <div className="mt-4 sm:mt-6">
              <h5 className="mb-2 text-xs font-semibold text-slate-900">
                Tải ứng dụng
              </h5>
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                {badges.map((b, i) => (
                  <a
                    key={i}
                    href={b.href}
                    className="inline-flex items-center rounded-lg bg-slate-900 px-2 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-medium text-white hover:opacity-90 transition-opacity"
                  >
                    <span className="block">{b.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Payments & Shippings */}
        <div className="grid gap-4 sm:gap-6 border-t border-slate-200 py-6 sm:py-8 md:grid-cols-2 lg:grid-cols-3">
          <div className="text-center sm:text-left">
            <h5 className="mb-2 sm:mb-3 text-xs font-semibold text-slate-900">
              Phương thức thanh toán
            </h5>
            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 sm:gap-2">
              {payments.map((p, i) => (
                <Tag key={i} label={p} />
              ))}
            </div>
          </div>

          <div className="text-center sm:text-left">
            <h5 className="mb-2 sm:mb-3 text-xs font-semibold text-slate-900">
              Đối tác vận chuyển
            </h5>
            <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 sm:gap-2">
              {shippings.map((s, i) => (
                <Tag key={i} label={s} />
              ))}
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-1 text-center sm:text-left lg:text-right">
            <h5 className="mb-2 sm:mb-3 text-xs font-semibold text-slate-900">
              Chăm sóc khách hàng
            </h5>
            <p className="text-xs text-slate-700">
              Hotline:{' '}
              <a href="tel:19001234" className="font-semibold text-sky-600 hover:text-sky-700">
                1900 1234
              </a>{' '}
              (8:00 - 21:00)
            </p>
            <p className="mt-1 text-xs text-slate-700">
              Email:{' '}
              <a
                href="mailto:cs@everymart.vn"
                className="font-semibold text-sky-600 hover:text-sky-700"
              >
                cs@everymart.vn
              </a>
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-slate-200 py-4">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex flex-wrap items-center justify-center gap-x-3 sm:gap-x-4 gap-y-2 order-2 sm:order-1">
              {bottomLinks.map((b, i) => (
                <a
                  key={i}
                  href={b.href}
                  className="text-[10px] sm:text-[11px] text-slate-600 hover:text-slate-900 hover:underline transition-colors"
                >
                  {b.label}
                </a>
              ))}
            </div>
            <div className="text-[10px] sm:text-[11px] text-slate-500 order-1 sm:order-2 text-center sm:text-left">
              {store.copyright}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ====== small UI helpers ====== */
function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] sm:text-[11px] font-medium text-slate-700">
      {label}
    </span>
  );
}

function SocialIcon({ name }: { name: Social['name'] }) {
  const common = 'h-3 w-3 sm:h-4 sm:w-4';
  switch (name) {
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="currentColor">
          <path d="M22 12.06C22 6.48 17.52 2 12 2S2 6.48 2 12.06c0 5.01 3.66 9.16 8.44 9.94v-7.03H7.9v-2.9h2.54V9.41c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.9h-2.34V22c4.78-.78 8.44-4.93 8.44-9.94z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="currentColor">
          <path d="M23.5 6.2s-.2-1.4-.8-2c-.8-.8-1.7-.8-2.1-.9C17.2 3 12 3 12 3h0s-5.2 0-8.6.3c-.4 0-1.3.1-2.1.9-.6.6-.8 2-.8 2S0 7.9 0 9.5v1.9c0 1.6.2 3.3.2 3.3s.2 1.4.8 2c.8.8 1.8.8 2.3.9 1.7.2 7.3.3 7.3.3s5.2 0 8.6-.3c.4 0 1.3-.1 2.1-.9.6-.6.8-2 .8-2S24 13 24 11.4V9.5c0-1.6-.2-3.3-.2-3.3zM9.6 14.7V7.9l6.3 3.4-6.3 3.4z" />
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="currentColor">
          <path d="M12.9 2h3.1a6.7 6.7 0 0 0 6 6v3.2a9.7 9.7 0 0 1-4.5-1.2v5.7a6.6 6.6 0 1 1-6.6-6.6c.3 0 .7 0 1 .1V12a3.5 3.5 0 1 0 2.4 3.3V2z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="currentColor">
          <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM18 6.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
        </svg>
      );
    default:
      return null;
  }
}