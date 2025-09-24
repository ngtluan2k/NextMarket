// src/hooks/useSearchBreadcrumbs.ts
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Crumb } from "../components/Breadcrumb";

export const useSearchBreadcrumbs = (queryParam?: string): Crumb[] => {
  const [searchParams] = useSearchParams();
  const query = queryParam ?? searchParams.get("q") ?? "";

  return useMemo<Crumb[]>(() => {
    const crumbs: Crumb[] = [];

    if (query) {
      crumbs.push({
        label: `"${query}"`,
        to: `/search?q=${encodeURIComponent(query)}`,
        current: true,
      });
    } else {
      crumbs.push({ label: "Tìm kiếm", current: true });
    }

    return crumbs;
  }, [query]);
};
