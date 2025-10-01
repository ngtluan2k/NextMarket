// src/hooks/useCategoryBreadcrumbs.ts
import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { getCategoryBySlug } from "../../service/category.service";
import { Category, Crumb } from "../types/categories";

export function useCategoryBreadcrumbs(category?: Category): Crumb[] {
  const { slug } = useParams<{ slug: string }>();
  const { pathname } = useLocation();
  const isExplore = pathname.endsWith("/explore");

  const [fetchedCat, setFetchedCat] = useState<Category | null>(null);

  useEffect(() => {
    if (!category && slug) {
      getCategoryBySlug(slug)
        .then((data) => setFetchedCat({ slug, name: data.name }))
        .catch(() => setFetchedCat({ slug, name: slug.replace(/-/g, " ") }));
    }
  }, [category, slug]);

  const activeCategory = category ?? fetchedCat;

  return useMemo(() => {
    if (!slug) return [];

    const base: Crumb[] = [
      {
        label: activeCategory?.name || "Danh mục",
        name: activeCategory?.name, // giữ name để truyền ngược
        to: `/category/${slug}`,
        current: !isExplore,
      },
    ];

    return isExplore
      ? [...base, { label: "Khám phá danh mục", current: true }]
      : base;
  }, [activeCategory, slug, isExplore]);
}
