import axios from 'axios';

export interface Brand {
  id: number;
  name: string;
  logo_url?: string;
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
  image?: string;
}

// Lấy brand theo id
export const getBrandById = async (id: number): Promise<Brand> => {
  const token = localStorage.getItem('token');
  const res = await axios.get(`http://localhost:3000/brands/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.data.data;
};

// // Lấy các category liên quan đến brand
// export const fetchCategoriesByBrand = async (
//   brandId: number,
//   token?: string
// ): Promise<Category[]> => {
//   const res = await axios.get(
//     `http://localhost:3000/brands/${brandId}/categories`,
//     {
//       headers: token ? { Authorization: `Bearer ${token}` } : {},
//     }
//   );
//   return res.data.data; // mảng categories
// };

// Lấy toàn bộ brands
export const fetchBrandsAPI = async (): Promise<Brand[]> => {
  const res = await axios.get('http://localhost:3000/brands');
  return res.data.data; // tuỳ backend trả về
};
export const fetchCategoriesByBrandProducts = async (brandId: number) => {
  const token = localStorage.getItem('token') ?? undefined;
  const res = await fetch(`http://localhost:3000/brands/${brandId}/products`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  const products = data.data;

  const categories: { id: number; name: string }[] = [];
  products.forEach((p: any) => {
    p.categories?.forEach((c: any) => {
      if (c.category)
        categories.push({ id: c.category.id, name: c.category.name });
    });
  });

  return Array.from(new Map(categories.map((c) => [c.id, c])).values());
};
