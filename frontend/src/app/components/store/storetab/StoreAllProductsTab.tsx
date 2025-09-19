import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import StoreCategorySidebar, { StoreCategory } from "../StoreCategorySidebar";
import StoreProductsGrid, { SortKey, StoreProductsResponse } from "../StoreProductsGrid";

export default function StoreAllProductsTab() {
  const { slug = "" } = useParams();
  const { search, pathname } = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(search);
  const category = params.get("category"); // đọc từ URL

  // (demo) dữ liệu danh mục – bạn thay bằng API thật
  const [cats, setCats] = useState<StoreCategory[]>([]);
  useEffect(() => {
    (async () => {
      // const data = await fetch(`/api/stores/${slug}/categories`).then(r=>r.json());
      const data: StoreCategory[] = []; // <- thay bằng API
      setCats(data);
    })();
  }, [slug]);

  // state cho grid
  const [gridData, setGridData] = useState<StoreProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // khi grid báo tham số (q/sort/page) thay đổi → gọi API
  const handleParamsChange = async ({ q, sort, page, pageSize }: { q: string; sort: SortKey; page: number; pageSize: number; }) => {
    try {
      setLoading(true);
      const qs = new URLSearchParams({ q, sort, page: String(page), pageSize: String(pageSize) });
      if (category) qs.set("category", category);
      const res = await fetch(`/api/stores/${slug}/products?` + qs.toString());
      const data = await res.json();
      setGridData(data);
      setErr(null);
    } catch (e: any) {
      setErr(e.message || "Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  // chọn danh mục → cập nhật URL param category, reset page=1
  const selectCategory = (id: string | number | null) => {
    const p = new URLSearchParams(search);
    if (id == null) p.delete("category");
    else p.set("category", String(id));
    p.set("page", "1");
    navigate(`${pathname}?${p.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 gap-1 lg:grid-cols-[260px_1fr]">
      {/* sidebar: ẩn trên mobile */}
      <div className="hidden lg:block">
        <StoreCategorySidebar
          items={cats}
          selectedId={category}
          onSelect={selectCategory}
        />
      </div>

      {/* grid */}
      <StoreProductsGrid
        storeSlug={slug}
      />
    </div>
  );
}
