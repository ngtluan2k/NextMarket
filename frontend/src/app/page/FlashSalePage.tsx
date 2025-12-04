// pages/FlashSalePage.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  getAllFlashSalesForStore,
  getRegisteredProductsForStore,
  getAllFlashSalesForPublic,
  getProductsForPublic,
} from '../../service/flash_sale.service';
import EveryMartHeader from '../components/Navbar';
import Footer from '../components/Footer';

import type {
  FlashSaleApiProduct,
  FlashSaleProduct,
  FlashSaleSchedule,
  FlashSaleScheduleApi,
  FlashSaleTimeSlot,
} from '../components/flash-sale/types';
import { FlashSaleHeader } from '../components/flash-sale/Header';
import { HeroBanner } from '../components/flash-sale/FlashSaleHero';
import { TimeSlots } from '../components/flash-sale/CategoryTabs';
import { CountdownTimer } from '../components/flash-sale/CountdownTimer';
import { ProductGrid } from '../components/flash-sale/ProductGrid';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

const now = dayjs().tz('Asia/Ho_Chi_Minh');

// helper convert bất cứ thứ gì -> number
const toNumber = (value: unknown): number => {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const mapScheduleApiToSchedule = (
  schedule: FlashSaleScheduleApi
): FlashSaleSchedule => ({
  id: schedule.id,
  name: schedule.name,
  startsAt: new Date(schedule.starts_at),
  endsAt: new Date(schedule.ends_at),
  description: schedule.description,
  status: schedule.status,
});

// map dữ liệu product từ API -> UI
const mapApiProductToFlashSaleProduct = (
  apiProduct: FlashSaleApiProduct
): FlashSaleProduct => {
  // Name
  const name = apiProduct.product_name || apiProduct.name || 'Sản phẩm';

  // Image: ưu tiên image, fallback media, fallback placeholder
  const mediaPrimary =
    apiProduct.media?.find((m) => m.is_primary)?.url ||
    apiProduct.media?.[0]?.url;
  const image = apiProduct.image || mediaPrimary || '/placeholder.svg';

  // Rating & Reviews
  const rating = toNumber(apiProduct.rating ?? apiProduct.avg_rating);
  const reviews = toNumber(apiProduct.reviews ?? apiProduct.review_count);

  // Giá bán
  const salePrice = toNumber(
    apiProduct.flash_sale_price ??
      apiProduct.salePrice ??
      apiProduct.price ??
      apiProduct.base_price ??
      apiProduct.variants?.[0]?.price
  );

  // Giá gốc
  const originalPrice = toNumber(
    apiProduct.original_price ??
      apiProduct.originalPrice ??
      apiProduct.pricing_rules?.[0]?.price ??
      apiProduct.price ??
      (salePrice ? salePrice * 1.3 : 0)
  );

  // Tính discount
  let discount = 0;
  if (apiProduct.discount !== undefined && apiProduct.discount !== null) {
    discount = toNumber(apiProduct.discount);
  } else if (originalPrice > salePrice && salePrice > 0) {
    discount = Math.round(((originalPrice - salePrice) / originalPrice) * 100);
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
    badge: apiProduct.badge || 'FLASH SALE',
    remaining_quantity: toNumber(apiProduct.remaining_quantity),
    limit_quantity: toNumber(apiProduct.limit_quantity),
  };
};

export default function FlashSalePage() {
  const [schedules, setSchedules] = useState<FlashSaleSchedule[]>([]);
  const [activeSchedule, setActiveSchedule] =
    useState<FlashSaleSchedule | null>(null);
  const [products, setProducts] = useState<FlashSaleProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const getToken = (): string => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || '';
    }
    return '';
  };

  useEffect(() => {
    const token = getToken();
    setIsAuthenticated(Boolean(token));
  }, []);

  const fetchSchedules = async (): Promise<FlashSaleSchedule | null> => {
    try {
      let response: any;

      if (isAuthenticated) {
        const token = getToken();
        response = await getAllFlashSalesForStore(token);
      } else {
        response = await getAllFlashSalesForPublic();
      }

      let rawSchedules: FlashSaleScheduleApi[] = [];

      if (response && Array.isArray(response.data)) {
        rawSchedules = response.data;
      } else if (response && Array.isArray(response)) {
        rawSchedules = response;
      }

      if (rawSchedules.length === 0) {
        setError('Không có dữ liệu flash sale');
        return null;
      }

      const mappedSchedules = rawSchedules.map(mapScheduleApiToSchedule);
      setSchedules(mappedSchedules);

      const now = dayjs().tz('Asia/Ho_Chi_Minh');

      // 1. Tìm khung giờ đang diễn ra gần nhất
      let active = mappedSchedules.find((schedule) => {
        const start = dayjs(schedule.startsAt).tz('Asia/Ho_Chi_Minh');
        const end = dayjs(schedule.endsAt).tz('Asia/Ho_Chi_Minh');
        return (
          (now.isAfter(start) &&
            now.isBefore(end) &&
            schedule.status === 'upcoming') ||
          schedule.status === 'active'
        );
      });

      // 2. Nếu không có, chọn slot sắp tới gần nhất
      if (!active) {
        const upcomingSchedules = mappedSchedules
          .filter((s) => dayjs(s.startsAt).tz('Asia/Ho_Chi_Minh').isAfter(now))
          .sort((a, b) =>
            dayjs(a.startsAt)
              .tz('Asia/Ho_Chi_Minh')
              .diff(dayjs(b.startsAt).tz('Asia/Ho_Chi_Minh'))
          );
        active = upcomingSchedules[0] || mappedSchedules[0] || null; // fallback slot đầu tiên
      }

      setActiveSchedule(active);
      return active;
    } catch (err: any) {
      console.error('Lỗi khi lấy schedules:', err);
      if (err.response?.status === 401 && isAuthenticated) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setError('Lỗi khi tải dữ liệu flash sale');
      }
      return null;
    }
  };

  const fetchProducts = async (scheduleId: number): Promise<void> => {
    try {
      const response = await getProductsForPublic(scheduleId);
      console.log('API Products Response (Public):', response);

      // Vì API đã trả đúng dạng mảng FlashSaleApiProduct
      const productsData: FlashSaleApiProduct[] = Array.isArray(response)
        ? response
        : [];

      if (productsData.length > 0) {
        const mappedProducts = productsData.map(
          mapApiProductToFlashSaleProduct
        );
        console.log('Mapped products:', mappedProducts);
        setProducts(mappedProducts);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      console.error('Lỗi khi lấy sản phẩm:', err);
      setProducts([]);
      setError(
        err.response?.status === 404
          ? 'Không có sản phẩm flash sale'
          : 'Lỗi khi tải sản phẩm'
      );
    }
  };

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

    void initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const timeSlots: FlashSaleTimeSlot[] = schedules.map((schedule) => {
    const startTime = dayjs(schedule.startsAt)
      .tz('Asia/Ho_Chi_Minh')
      .format('HH:mm');
    const endTime = dayjs(schedule.endsAt)
      .tz('Asia/Ho_Chi_Minh')
      .format('HH:mm');

    const now = new Date();
    let label = 'Sắp diễn ra';
    let isHighlighted = false;

    if (schedule.startsAt <= now && schedule.endsAt > now) {
      label = 'Đang diễn ra';
      isHighlighted = true;
    } else if (schedule.endsAt <= now) {
      label = 'Đã kết thúc';
    }

    return { time: `${startTime} - ${endTime}`, label, isHighlighted };
  });

  const handleTimeSlotChange = (index: number) => {
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

      <div className="sticky top-0 z-50 bg-white">
        <FlashSaleHeader
          endsAt={activeSchedule ? new Date(activeSchedule.endsAt) : null}
        />
      </div>

      <HeroBanner />

      {schedules.length > 0 && (
        <div className="sticky top-[40px] z-40 bg-gray-900">
          <TimeSlots
            slots={timeSlots}
            activeIndex={schedules.findIndex(
              (s) => s.id === activeSchedule?.id
            )}
            onSlotChange={(_, __) => handleTimeSlotChange(_)}
          />
        </div>
      )}

      <CountdownTimer
        endsAt={activeSchedule ? new Date(activeSchedule.endsAt) : null}
      />

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

      {!loading && products.length === 0 && !error && (
        <div className="py-16 text-center">
          <div className="mx-auto max-w-md text-gray-500">
            <div className="mb-4 text-6xl">😔</div>
            <h3 className="mb-2 text-xl font-bold text-gray-700">
              {activeSchedule
                ? `Không có sản phẩm trong "${activeSchedule.name}"`
                : 'Không có flash sale đang diễn ra'}
            </h3>
            <p>
              {activeSchedule
                ? 'Hiện chưa có sản phẩm nào được đăng ký cho flash sale này.'
                : 'Hiện không có đợt flash sale nào đang hoạt động.'}
            </p>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
