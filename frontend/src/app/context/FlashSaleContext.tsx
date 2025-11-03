import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
  } from "react";
  import type { Category, Product, FlashSaleMeta } from "../components/flash-sale/types";
  import { api } from "../api/api"; 
  
  export type FlashSaleConfig = {
    baseUrl?: string; // KHÔNG dùng nữa khi đã dùng axios baseURL, giữ để tương thích
    endpoints?: {
      meta?: string;         // ví dụ: "/flashsale-meta" (nếu backend có). Nếu không, để undefined để dùng fallback.
      categories: string;    // "/categories"
      products: string;      // "/products"
      search?: string;       // "/products/search"
    };
    flashOnly?: boolean;
    pageSize?: number;
  };
  
  const DEFAULT_CONFIG: Required<Pick<FlashSaleConfig, "endpoints" | "pageSize" | "flashOnly">> = {
    endpoints: {
      // KHÔNG để /api ở đây vì backend của bạn không có global prefix
      meta: "/products/flash-sale",
      categories: "/categories",
      products: "/products/flash-sale",
      search: "/products/search",
    },
    pageSize: 24,
    flashOnly: false,
  };
  
  type FlashSaleState = {
    categories: Category[];
    products: Product[];
    meta: FlashSaleMeta | null;
    activeCategoryId: string;
    loading: boolean;
    error: string | null;
    page: number;
    total?: number;
  };
  
  type FlashSaleActions = {
    setActiveCategory: (id: string) => void;
    refetchAll: () => Promise<void>;
    fetchProducts: (opts?: { categoryId?: string; page?: number; query?: string }) => Promise<void>;
    loadMore: () => Promise<void>;
    search: (q: string) => Promise<void>;
  };
  
  const FlashSaleContext = createContext<(FlashSaleState & FlashSaleActions) | null>(null);
  
  /** Helper axios -> luôn unwrap { data } nếu backend trả kiểu { data: ... } */
  async function getJSON<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    const res = await api.get(url, { params });
    console.log("📥 API Response:", {
    url,
    params,
    status: res.status,
    data: res.data,
  });
    // chuẩn hoá: { data: ... } hoặc trả mảng trực tiếp
    const payload: any = res.data;
    return (payload?.data ?? payload) as T;
  }
  
  export function FlashSaleProvider({
    children,
    config: userConfig,
    initialCategory = "all",
  }: {
    children: React.ReactNode;
    config?: FlashSaleConfig;
    initialCategory?: string;
  }) {
    const config = useMemo(() => {
      const ep = { ...DEFAULT_CONFIG.endpoints, ...(userConfig?.endpoints || {}) };
      return {
        flashOnly: userConfig?.flashOnly ?? DEFAULT_CONFIG.flashOnly,
        pageSize: userConfig?.pageSize ?? DEFAULT_CONFIG.pageSize,
        endpoints: ep,
      };
    }, [userConfig]);
  
    const [state, setState] = useState<FlashSaleState>({
      categories: [],
      products: [],
      meta: null,
      activeCategoryId: initialCategory,
      loading: true,
      error: null,
      page: 1,
      total: undefined,
    });
  
    const fetchMeta = useCallback(async () => {
      // Nếu chưa cấu hình endpoint meta => dùng fallback 2 giờ
      if (!config.endpoints.meta) {
        const fallback: FlashSaleMeta = { endAt: Date.now() + 2 * 3600 * 1000 };
        setState((s) => ({ ...s, meta: fallback }));
        return;
      }
      const meta = await getJSON<FlashSaleMeta>(config.endpoints.meta);
      setState((s) => ({ ...s, meta }));
    }, [config.endpoints.meta]);
  
    const fetchCategories = useCallback(async () => {
      const data = await getJSON<Category[] | { total: number; data: Category[] }>(
        config.endpoints.categories
      );
      const categories = Array.isArray(data) ? data : data.data;
      const withAll = [{ id: "all", name: "Tất Cả" }, ...categories];
      setState((s) => ({ ...s, categories: withAll }));
    }, [config.endpoints.categories]);
  
    const fetchProducts = useCallback(
      
      async (opts?: { categoryId?: string; page?: number; query?: string }) => {
        const categoryId = opts?.categoryId ?? state.activeCategoryId;
        const page = opts?.page ?? 1;
  
        // Search ưu tiên nếu có endpoint search
        if (opts?.query && config.endpoints.search) {
          const data = await getJSON<Product[] | { data: Product[] }>(
            config.endpoints.search,
            { q: opts.query }
          );
          const items = Array.isArray(data) ? data : data.data;
          setState((s) => ({ ...s, products: items, page, total: items.length }));
          return;
        }
        console.log("📦 Fetching products from:", config.endpoints.products);

  
        // Params cho products
        const params: Record<string, any> = {
          page,
          limit: config.pageSize,
        };
        if (config.flashOnly) params.flashOnly = true;
        if (categoryId && categoryId !== "all") params.categoryId = categoryId;
  
        const data = await getJSON<
          Product[] | { items: Product[]; total?: number } | { data: Product[]; total?: number }
        >(config.endpoints.products, params);
  
        let items: Product[] = [];
        let total: number | undefined;
  
        if (Array.isArray(data)) {
          items = data;
        } else if ("items" in (data as any)) {
          items = (data as any).items;
          total = (data as any).total;
        } else {
          items = (data as any).data;
          total = (data as any).total;
        }
  
        setState((s) => ({
          ...s,
          products: page === 1 ? items : [...s.products, ...items],
          page,
          total,
        }));
      },
      [config.endpoints.products, config.endpoints.search, config.flashOnly, config.pageSize, state.activeCategoryId]
    );
  
    const loadMore = useCallback(async () => {
      await fetchProducts({ page: state.page + 1 });
    }, [fetchProducts, state.page]);
  
    const setActiveCategory = useCallback((id: string) => {
      setState((s) => ({ ...s, activeCategoryId: id }));
    }, []);
  
    const refetchAll = useCallback(async () => {
      try {
        setState((s) => ({ ...s, loading: true, error: null }));
        await Promise.all([fetchMeta(), fetchCategories()]);
        await fetchProducts({ page: 1 });
        setState((s) => ({ ...s, loading: false }));
      } catch (e: any) {
        setState((s) => ({
          ...s,
          loading: false,
          error: e?.message || "Không thể tải dữ liệu.",
        }));
      }
    }, [fetchCategories, fetchMeta, fetchProducts]);
  
    useEffect(() => {
      refetchAll();      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  
    useEffect(() => {
      fetchProducts({ categoryId: state.activeCategoryId, page: 1 }).catch((e) =>
        setState((s) => ({ ...s, error: e?.message || "Không thể tải sản phẩm." }))
      );
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.activeCategoryId]);
  
    const value = useMemo(
      () => ({
        categories: state.categories,
        products: state.products,
        meta: state.meta,
        activeCategoryId: state.activeCategoryId,
        loading: state.loading,
        error: state.error,
        page: state.page,
        total: state.total,
  
        setActiveCategory,
        refetchAll,
        fetchProducts,
        loadMore,
        search: async (q: string) => fetchProducts({ query: q, page: 1 }),
      }),
      [state, setActiveCategory, refetchAll, fetchProducts, loadMore]
    );
  
    return <FlashSaleContext.Provider value={value}>{children}</FlashSaleContext.Provider>;
  }
  
  export function useFlashSale() {
    const ctx = useContext(FlashSaleContext);
    if (!ctx) throw new Error("useFlashSale must be used within FlashSaleProvider");
    return ctx;
  }
  