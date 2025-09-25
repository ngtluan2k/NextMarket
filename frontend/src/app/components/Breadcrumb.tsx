// src/components/Breadcrumb.tsx
import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

export type Crumb = {
  label: string;
  to?: string;
  href?: string;
  current?: boolean;
  name?: string; // thêm để phân biệt slug vs name
};

type Props = {
  items: Crumb[];
  className?: string;
  onItemClick?: (crumb: Crumb) => void;
};

export default function Breadcrumb({ items, className = "", onItemClick }: Props) {
const A = ({ crumb, children }: { crumb: Crumb; children: React.ReactNode }) => {
  const handleClick = (e: React.MouseEvent) => {
    if (!onItemClick) return;
    // Nếu là home thì cho đi thẳng, không trigger onItemClick
    if (crumb.to === "/" || crumb.href === "/") return;

    e.preventDefault();
    onItemClick(crumb);
  };

  if (crumb.to) {
    return (
      <Link to={crumb.to} onClick={handleClick} className="hover:text-slate-900">
        {children}
      </Link>
    );
  }
  if (crumb.href) {
    return (
      <a href={crumb.href} onClick={handleClick} className="hover:text-slate-900">
        {children}
      </a>
    );
  }
  return (
    <span onClick={handleClick} className="cursor-pointer">
      {children}
    </span>
  );
};

  return (
    <nav aria-label="Breadcrumb" className={`text-sm text-slate-600 ${className}`}
         itemScope itemType="https://schema.org/BreadcrumbList">
      <ol className="flex items-center gap-2">
        {/* Home */}
        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem"
            className="flex items-center gap-1">
          <A crumb={{ label: "Trang chủ", to: "/" }}>
            <span className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900">
              <span>🏠</span><span className="hidden sm:inline">Trang chủ</span>
            </span>
          </A>
          <meta itemProp="position" content="1" />
        </li>

        {items.map((it, i) => (
          <li key={i}
              itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem"
              className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <A crumb={it}>
              <span className={it.current ? "font-medium text-slate-900" : "text-slate-600 hover:text-slate-900"}
                    aria-current={it.current ? "page" : undefined}
                    itemProp="name">
                {it.label || "…"}
              </span>
            </A>
            <meta itemProp="position" content={`${i + 2}`} />
          </li>
        ))}
      </ol>
    </nav>
  );
}
