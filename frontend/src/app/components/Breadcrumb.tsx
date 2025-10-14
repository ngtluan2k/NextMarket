// src/components/Breadcrumb.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { LucideProps } from 'lucide-react';
import { ChevronRight as ChevronRightIcon, Home as HomeIcon } from 'lucide-react';

export type Crumb = {
  label: string;
  to?: string;
  href?: string;
  current?: boolean;
  name?: string;
};

type Props = {
  items: Crumb[];
  className?: string;
  onItemClick?: (crumb: Crumb) => void;
  /** Icon phân cách giữa các crumb (mặc định: ChevronRight) */
  separatorIcon?: React.ComponentType<LucideProps>;
  /** Icon cho “Trang chủ” (mặc định: Home) */
  homeIcon?: React.ComponentType<LucideProps>;
  /** Kích thước icon (px) */
  iconSize?: number;
};

export default function Breadcrumb({
  items,
  className = '',
  onItemClick,
  separatorIcon: SeparatorIcon = ChevronRightIcon,
  homeIcon: HomeIco = HomeIcon,
  iconSize = 16,
}: Props) {
  const A = ({
    crumb,
    children,
  }: {
    crumb: Crumb;
    children: React.ReactNode;
  }) => {
    const handleClick = (e: React.MouseEvent) => {
      if (!onItemClick) return;
      // Cho home đi thẳng, không intercept
      if (crumb.to === '/' || crumb.href === '/') return;
      e.preventDefault();
      onItemClick(crumb);
    };

    if (crumb.to) {
      return (
        <Link to={crumb.to} onClick={handleClick} className="hover:text-slate-900" itemProp="item">
          {children}
        </Link>
      );
    }
    if (crumb.href) {
      return (
        <a href={crumb.href} onClick={handleClick} className="hover:text-slate-900" itemProp="item">
          {children}
        </a>
      );
    }
    return (
      <span onClick={handleClick} className="cursor-pointer" itemProp="item">
        {children}
      </span>
    );
  };

  return (
    <nav
      aria-label="Breadcrumb"
      className={`text-sm text-slate-600 ${className}`}
      itemScope
      itemType="https://schema.org/BreadcrumbList"
    >
      <ol className="flex items-center gap-2">
        {/* Home */}
        <li
          itemProp="itemListElement"
          itemScope
          itemType="https://schema.org/ListItem"
          className="flex items-center gap-1"
        >
          <A crumb={{ label: 'Trang chủ', to: '/' }}>
            <span className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900">
              <HomeIco size={iconSize} className="shrink-0" aria-hidden />
              <span className="hidden sm:inline">Trang chủ</span>
            </span>
          </A>
          <meta itemProp="name" content="Trang chủ" />
          <meta itemProp="position" content="1" />
        </li>

        {items.map((it, i) => (
          <li
            key={i}
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
            className="flex items-center gap-2"
          >
            <SeparatorIcon size={iconSize} className="text-slate-400" aria-hidden />
            <A crumb={it}>
              <span
                className={
                  it.current
                    ? 'font-medium text-slate-900'
                    : 'text-slate-600 hover:text-slate-900'
                }
                aria-current={it.current ? 'page' : undefined}
                itemProp="name"
              >
                {it.label || '…'}
              </span>
            </A>
            <meta itemProp="position" content={`${i + 2}`} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
