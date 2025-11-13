// pages/FlashSalePage.tsx
"use client";
import { useState, useEffect } from "react";
import {
  getAllFlashSalesForStore,
  getRegisteredProductsForStore,
  getAllFlashSalesForPublic,
  getProductsForPublic,
} from "../../service/flash_sale.service";

import { FlashSaleHeader } from "../components/flash-sale/header";
import { TimeSlots } from "../components/flash-sale/time-slots";
import { CountdownTimer } from "../components/flash-sale/countdown-timer";
import { HeroBanner } from "../components/flash-sale/hero-banner";
import { ProductGrid } from "../components/flash-sale/product-grid";
import EveryMartHeader from "../components/Navbar";
import Footer from "../components/Footer";

interface Schedule {
  id: number;
  name: string;
  starts_at: string;
  ends_at: string;
  description?: string;
  status: string;
}

interface ApiProduct {
  id: number;

  // tên
  name?: string;
  product_name?: string;

  // media
  image?: string;
  media?: Array<{ url: string; is_primary?: boolean }>;

  // rating
  rating?: number | string;
  avg_rating?: number | string;
  review_count?: number | string;
  reviews?: number | string;

  // giá
  price?: number | string;
  base_price?: number | string;
  flash_sale_price?: number | string;
  original_price?: number | string;
  salePrice?: number | string;
  originalPrice?: number | string;
  discount?: number | string;

  limit_quantity?: number;
  remaining_quantity?: number;
  stock?: number;
  brand?: { name: string } | string;
  variants?: Array<{ price: number | string; stock?: number }>;
  pricing_rules?: Array<{ price: number | string }>;
  badge?: string;
}

interface Product {
  id: number;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  originalPrice: number;
  salePrice: number;
  discount: number;
  badge: string;
}

// helper convert bất cứ thứ gì -> number
const toNumber = (value: any): number => {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

export default function FlashSalePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const getToken = (): string => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token") || "";
    }
    return "";
  };

  useEffect(() => {
    const token = getToken();
    setIsAuthenticated(!!token);
  }, []);

  // map dữ liệu product từ API -> UI
  const mapApiProductToProduct = (apiProduct: ApiProduct): Product => {
    const name = apiProduct.product_name || apiProduct.name || "Sản phẩm";

    // ảnh: ưu tiên primary, sau đó ảnh đầu, cuối cùng placeholder
    const mediaPrimary =
      apiProduct.media?.find((m) => m.is_primary)?.url ||
      apiProduct.media?.[0]?.url;
    const image = apiProduct.image || mediaPrimary || "/placeholder.svg";

    const rating = toNumber(apiProduct.rating ?? apiProduct.avg_rating);
    const reviews = toNumber(apiProduct.reviews ?? apiProduct.review_count);

    // GIÁ ĐANG BÁN
    const salePrice = toNumber(
      apiProduct.flash_sale_price ??
        apiProduct.salePrice ??
        apiProduct.price ??
        apiProduct.base_price ??
        apiProduct.variants?.[0]?.price
    );

    // GIÁ GỐC
    const originalPrice = toNumber(
      apiProduct.original_price ??
        apiProduct.originalPrice ??
        apiProduct.pricing_rules?.[0]?.price ??
        apiProduct.price ??
        (salePrice ? salePrice * 1.3 : 0)
    );

    // % GIẢM GIÁ
    let discount = 0;
    const apiDiscount =
      apiProduct.discount !== undefined && apiProduct.discount !== null
        ? toNumber(apiProduct.discount)
        : null;

    if (apiDiscount !== null && apiDiscount > 0) {
      discount = apiDiscount;
    } else if (originalPrice > salePrice && salePrice > 0) {
      discount = Math.round(
        ((originalPrice - salePrice) / originalPrice) * 100
      );
    }

    return {
      id: apiProduct.id,
      name,
      image,
      rating,
      reviews,
      originalPrice,
      salePrice,
      discount,
      badge: apiProduct.badge || "FLASH SALE",
    };
  };

  // lấy list schedule
  const fetchSchedules = async () => {
    try {
      let response;

      if (isAuthenticated) {
        const token = getToken();
        response = await getAllFlashSalesForStore(token);
      } else {
        response = await getAllFlashSalesForPublic();
      }

      console.log("API Schedules Response:", response);

      let schedulesData: Schedule[] = [];

      if (response && Array.isArray(response.data)) {
        schedulesData = response.data;
      } else if (response && Array.isArray(response)) {
        schedulesData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        schedulesData = response.data;
      }

      if (schedulesData.length === 0) {
        setError("Không có dữ liệu flash sale");
        return null;
      }

      setSchedules(schedulesData);

      const now = new Date();
      const active = schedulesData.find((schedule: Schedule) => {
        const startTime = new Date(schedule.starts_at);
        const endTime = new Date(schedule.ends_at);
        return startTime <= now && endTime >= now && schedule.status === "active";
      });

      const selectedSchedule = active || schedulesData[0] || null;
      setActiveSchedule(selectedSchedule);
      return selectedSchedule;
    } catch (error: any) {
      console.error("Lỗi khi lấy schedules:", error);
      if (error.response?.status === 401 && isAuthenticated) {
        setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
      } else {
        setError("Lỗi khi tải dữ liệu flash sale");
      }
      return null;
    }
  };

  // lấy sản phẩm theo schedule
  const fetchProducts = async (scheduleId: number) => {
    try {
      let response;

      if (isAuthenticated) {
        const token = getToken();
        response = await getRegisteredProductsForStore(scheduleId, token);
      } else {
        response = await getProductsForPublic(scheduleId);
      }

      console.log("API Products Response:", response);

      let productsData: ApiProduct[] = [];

      if (response && Array.isArray(response.data)) {
        productsData = response.data;
      } else if (response && Array.isArray(response.products)) {
        productsData = response.products;
      } else if (
        response &&
        response.data &&
        Array.isArray(response.data.products)
      ) {
        productsData = response.data.products;
      } else if (response && Array.isArray(response)) {
        productsData = response;
      }

      if (productsData.length > 0) {
        const mappedProducts = productsData.map(mapApiProductToProduct);
        console.log("Mapped products:", mappedProducts);
        setProducts(mappedProducts);
      } else {
        setProducts([]);
      }
    } catch (error: any) {
      console.error("Lỗi khi lấy sản phẩm:", error);
      if (error.response?.status === 404) {
        setProducts([]);
      } else if (error.response?.status === 401 && isAuthenticated) {
        setError("Không có quyền truy cập sản phẩm flash sale");
      } else {
        setError("Lỗi khi tải sản phẩm");
      }
      setProducts([]);
    }
  };

  // init
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);

      const schedule = await fetchSchedules();
      if (schedule) {
        await fetchProducts(schedule.id);
      }

      setLoading(false);
    };

    initializeData();
  }, [isAuthenticated]);

  // time slots cho thanh khung giờ
  const timeSlots = schedules.map((schedule) => {
    const start = new Date(schedule.starts_at);
    const end = new Date(schedule.ends_at);

    const startTime = start.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endTime = end.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const timeDisplay = `${startTime} - ${endTime}`;

    let label = "Sắp diễn ra";
    let highlight = false;

    const now = new Date();
    if (start <= now && end > now) {
      label = "Đang diễn ra";
      highlight = true;
    } else if (end <= now) {
      label = "Đã kết thúc";
    }

    return {
      time: timeDisplay,
      label,
      highlight,
    };
  });

  const handleTimeChange = (index: number) => {
    const selectedSchedule = schedules[index];
    if (selectedSchedule) {
      setActiveSchedule(selectedSchedule);
      setLoading(true);
      fetchProducts(selectedSchedule.id).finally(() => setLoading(false));
    }
  };

  return (
    <main className="min-h-screen bg-white">
      <EveryMartHeader />
  
      {/* Thanh FLASH SALE mỏng, luôn dính trên cùng */}
      <div className="sticky top-0 z-50 bg-white">
        <FlashSaleHeader
          endsAt={activeSchedule ? new Date(activeSchedule.ends_at) : null}
        />
      </div>
  
      {/* Banner lớn – cuộn là biến mất bình thường */}
      <HeroBanner />
  
      {/* Thanh khung giờ: ban đầu nằm dưới banner, 
          cuộn xuống thì dính ngay dưới FlashSaleHeader */}
      {schedules.length > 0 && (
        <div className="sticky z-40 bg-gray-900 top-[40px]">
          {/* top-[40px] ~ chiều cao FlashSaleHeader, 
              nếu header cao hơn thì chỉnh số px này lại */}
          <TimeSlots
            times={timeSlots.map((slot) => ({
              time: slot.time,
              label: slot.label,
              highlight: slot.highlight,
            }))}
            onTimeChange={handleTimeChange}
          />
        </div>
      )}
  
      {/* Countdown lớn phía dưới */}
      <CountdownTimer
        endsAt={activeSchedule ? new Date(activeSchedule.ends_at) : null}
      />
  
      {/* Thông báo lỗi */}
      {error && (
        <div className="mx-4 mt-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
          <div className="flex items-center justify-between">
            <p className="font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="ml-4 rounded bg-red-500 px-3 py-1 text-sm text-white hover:bg-red-600"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}
  
      {/* Sản phẩm */}
      {loading ? (
        <div className="py-16 text-center">
          <div className="inline-flex items-center gap-3 text-gray-600">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-red-600" />
            <p className="text-lg font-medium">
              Đang tải sản phẩm flash sale...
            </p>
          </div>
        </div>
      ) : (
        <ProductGrid products={products} />
      )}
  
      {/* Không có sản phẩm */}
      {!loading && products.length === 0 && !error && (
        <div className="py-16 text-center">
          <div className="mx-auto max-w-md text-gray-500">
            <div className="mb-4 text-6xl">😔</div>
            <h3 className="mb-2 text-xl font-bold text-gray-700">
              {activeSchedule
                ? `Không có sản phẩm trong "${activeSchedule.name}"`
                : "Không có flash sale đang diễn ra"}
            </h3>
            <p>
              {activeSchedule
                ? "Hiện chưa có sản phẩm nào được đăng ký cho flash sale này."
                : "Hiện không có đợt flash sale nào đang hoạt động."}
            </p>
          </div>
        </div>
      )}
  
      <Footer />
    </main>
  );
}
