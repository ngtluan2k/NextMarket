// frontend/src/service/category.service.ts
export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  children?: Category[];
}

export const fetchCategoriesAPI = async (): Promise<Category[]> => {
  const res = await fetch("http://localhost:3000/categories", {
  });
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json(); // trả về mảng category
};

// API lấy category theo slug
export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  const res = await fetch(`http://localhost:3000/categories/by-slug/${slug}`, {
  });
  if (!res.ok) throw new Error("Category not found");
  return res.json(); // trả về 1 category object
};

// src/service/categorySidebar.service.ts
export const fetchRootCategoriesAPI = async () => {
  const res = await fetch("http://localhost:3000/categories", {
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();

  // map API về CatNode
  return json.data.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    hasChildren: c.children?.length > 0, // nếu backend trả luôn mảng children
  }));
};

export const fetchChildCategoriesAPI = async (parentId: string | number) => {
  const res = await fetch(
    `http://localhost:3000/categories/${parentId}/children`,
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const json = await res.json();

  return json.data.map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    hasChildren: c.children?.length > 0,
  }));
};