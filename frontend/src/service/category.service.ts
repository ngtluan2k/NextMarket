// src/service/category.service.ts

// ===== Types =====
export type CatNode = {
    id: string;           // dùng làm slug/đường dẫn
    name: string;         // tên hiển thị
    children?: CatNode[]; // danh mục con (nếu có)
  };
  
  // ===== Mock data (có thể thay bằng API thật) =====
  export const mockCategories: CatNode[] = [
    {
      id: "kitchen",
      name: "Dụng cụ nhà bếp",
      children: [
        { id: "kitchen-knife", name: "Dao, kéo" },
        { id: "kitchen-pan", name: "Nồi, chảo" },
        { id: "kitchen-storage", name: "Hộp đựng / Bảo quản" },
        { id: "kitchen-tools", name: "Dụng cụ nấu ăn" },
      ],
    },
    {
      id: "dining",
      name: "Đồ dùng phòng ăn",
      children: [
        { id: "dining-plate", name: "Chén, dĩa, tô" },
        { id: "dining-cup", name: "Ly, cốc" },
        { id: "dining-cutlery", name: "Muỗng nĩa / Dao bàn" },
        { id: "dining-tableware", name: "Bộ bàn ăn" },
      ],
    },
    {
      id: "interior",
      name: "Nội thất",
      children: [
        { id: "interior-table", name: "Bàn" },
        { id: "interior-chair", name: "Ghế" },
        { id: "interior-shelf", name: "Kệ / Tủ" },
        { id: "interior-sofa", name: "Sofa" },
      ],
    },
    {
      id: "bedroom",
      name: "Đồ dùng phòng ngủ",
      children: [
        { id: "bedroom-pillow", name: "Gối / Ruột gối" },
        { id: "bedroom-blanket", name: "Chăn / Mền" },
        { id: "bedroom-sheet", name: "Ga giường" },
        { id: "bedroom-mosquito", name: "Mùng / Màn" },
      ],
    },
    {
      id: "decor",
      name: "Trang trí nhà cửa",
      children: [
        { id: "decor-picture", name: "Tranh / Khung ảnh" },
        { id: "decor-vase", name: "Bình hoa / Lọ" },
        { id: "decor-candle", name: "Nến thơm / Tinh dầu" },
        { id: "decor-rug", name: "Thảm / Thảm trải sàn" },
      ],
    },
    {
      id: "lighting",
      name: "Đèn & thiết bị chiếu sáng",
      children: [
        { id: "light-desk", name: "Đèn bàn" },
        { id: "light-night", name: "Đèn ngủ" },
        { id: "light-ceiling", name: "Đèn trần" },
        { id: "light-bulb", name: "Bóng đèn" },
      ],
    },
    {
      id: "outdoor",
      name: "Ngoài trời & sân vườn",
      children: [
        { id: "outdoor-bbq", name: "BBQ / Nướng" },
        { id: "outdoor-garden", name: "Làm vườn" },
        { id: "outdoor-furniture", name: "Bàn ghế ngoài trời" },
        { id: "outdoor-cover", name: "Bạt / Che mưa nắng" },
      ],
    },
    {
      id: "bath",
      name: "Đồ dùng & thiết bị nhà tắm",
      children: [
        { id: "bath-shower", name: "Sen vòi / Vòi sen" },
        { id: "bath-mat", name: "Thảm nhà tắm" },
        { id: "bath-storage", name: "Kệ / Rack phòng tắm" },
        { id: "bath-accessories", name: "Phụ kiện nhà tắm" },
      ],
    },
    {
      id: "repair",
      name: "Sửa chữa nhà cửa",
      children: [
        { id: "repair-tools", name: "Bộ dụng cụ" },
        { id: "repair-drill", name: "Máy khoan" },
        { id: "repair-tape", name: "Keo / Băng dính" },
        { id: "repair-lock", name: "Ổ khóa / Bản lề" },
      ],
    },
    {
      id: "music",
      name: "Nhạc cụ",
      children: [
        { id: "music-guitar", name: "Guitar" },
        { id: "music-ukulele", name: "Ukulele" },
        { id: "music-piano", name: "Piano / Organ" },
        { id: "music-percussion", name: "Trống / Gõ" },
      ],
    },
    {
      id: "pet",
      name: "Đồ thú cưng",
      children: [
        { id: "pet-food", name: "Thức ăn" },
        { id: "pet-bed", name: "Giường / Đệm" },
        { id: "pet-collar", name: "Vòng cổ / Dây dắt" },
        { id: "pet-toy", name: "Đồ chơi" },
      ],
    },
    {
      id: "utilities",
      name: "Dụng cụ & Thiết bị tiện ích",
      children: [
        { id: "util-clean", name: "Lau dọn / Vệ sinh" },
        { id: "util-storage", name: "Sắp xếp / Lưu trữ" },
        { id: "util-power", name: "Ổ cắm / Dây điện" },
        { id: "util-safety", name: "An toàn / Bảo hộ" },
      ],
    },
  ];
  
  // ===== Helpers =====
  export function flattenCategories(nodes: CatNode[], out: CatNode[] = []): CatNode[] {
    for (const n of nodes) {
      out.push({ id: n.id, name: n.name });
      if (n.children?.length) flattenCategories(n.children, out);
    }
    return out;
  }
  
  // ===== Mock API (thay bằng API thật khi sẵn sàng) =====
  /** Lấy toàn bộ cây danh mục (giả lập delay 500ms) */
  export function fetchCategoriesAPI(): Promise<CatNode[]> {
    return new Promise((resolve) => setTimeout(() => resolve(structuredClone(mockCategories)), 500));
  }
  
  /** Lấy danh mục theo slug/id (dùng cho Breadcrumb) */
  export async function getCategoryBySlug(slug: string): Promise<{ id: string; name: string }> {
    // --- Nếu có backend, dùng:
    // const res = await fetch(`http://localhost:3000/categories/${encodeURIComponent(slug)}`);
    // if (res.ok) { const data = await res.json(); return { id: data.id, name: data.name }; }
  
    // Fallback: tìm trong mock
    const all = await fetchCategoriesAPI();
    const flat = flattenCategories(all);
    const found = flat.find((x) => x.id === slug);
    return { id: slug, name: found?.name ?? "" };
  }
  
  /** (tuỳ chọn) Lấy danh mục con của 1 danh mục */
  export async function fetchCategoryChildren(parentId: string): Promise<CatNode[]> {
    const tree = await fetchCategoriesAPI();
    const stack = [...tree];
    while (stack.length) {
      const n = stack.pop()!;
      if (n.id === parentId) return n.children ?? [];
      if (n.children) stack.push(...n.children);
    }
    return [];
  }
  