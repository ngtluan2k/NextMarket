// src/components/Breadcrumb.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export type Crumb = {
  label: string;
  to?: string;
  href?: string;
  current?: boolean;
};

export default function Breadcrumb({
  items,
  className = '',
}: {
  items: Crumb[];
  className?: string;
}) {
  const A = ({ to, href, children }: any) =>
    to ? (
      <Link to={to} className="hover:text-slate-900">
        {children}
      </Link>
    ) : href ? (
      <a href={href} className="hover:text-slate-900">
        {children}
      </a>
    ) : (
      <span>{children}</span>
    );

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
          <A to="/" href="/">
            <span className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Trang chủ</span>
            </span>
          </A>
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
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <A to={it.to} href={it.href}>
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
