// frontend/src/service/category.service.ts
export interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id?: number | null;
  children?: Category[];
}


export interface Product {
  id: number;
  name: string;
  media?: { url: string }[];
  brand?: { id: number; name: string; imageUrl?: string };
  variants?: any[];
}

export interface Brand {
  id: number;
  name: string;
  logo_url?: string;
}

// 1️⃣ Lấy tất cả categories
export const fetchCategoriesAPI = async (): Promise<Category[]> => {
  const res = await fetch("http://localhost:3000/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
};

// 2️⃣ Lấy category theo slug
export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  const res = await fetch(`http://localhost:3000/categories/by-slug/${slug}`);
  if (!res.ok) throw new Error("Category not found");
  return res.json();
};

// 3️⃣ Lấy tất cả sản phẩm của category
export const fetchProductsByCategory = async (slug: string): Promise<Product[]> => {
  const res = await fetch(`http://localhost:3000/categories/${slug}/products`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json(); // backend trả mảng product
};

// 4️⃣ Lấy brand duy nhất của category
export const fetchBrandsByCategory = async (slug: string): Promise<Brand[]> => {
  const res = await fetch(`http://localhost:3000/categories/${slug}/brands`);
  if (!res.ok) throw new Error("Failed to fetch brands");
  return res.json(); // backend trả mảng brand
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