import React, { useState, useEffect } from 'react';
import { Ticket, Clock, AlertCircle, Gift, Tag, X } from 'lucide-react';
import { Carousel } from 'antd';
import { 
  Voucher, 
  VoucherDiscountType, 
  VoucherStatus 
} from '../../types/voucher';
import { userVoucherApi } from '../../api/voucher.api';
const vnd = (n?: number) =>
  (n ?? 0).toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  });

interface ComboStripProps {
  storeId?: number;
  productId?: number;
}

export default function ComboStrip({ storeId, productId }: ComboStripProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

useEffect(() => {
  const fetchVouchers = async () => {
    if (!storeId) {
      setVouchers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try { 
      const data = await userVoucherApi.getAvailableVouchers(storeId);
      
      // Chỉ filter thêm theo productId nếu cần
      let filteredVouchers = data;
      if (productId) {
        filteredVouchers = data.filter((v) => {
          if (v.excluded_product_ids?.includes(productId)) return false;
          if (v.applicable_product_ids?.length)
            return v.applicable_product_ids.includes(productId);
          return true;
        });
      }

      setVouchers(filteredVouchers);
    } catch (err) {
      console.error('Lỗi khi tải voucher:', err);
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  fetchVouchers();
}, [storeId, productId]);

  const formatDiscount = (voucher: Voucher): string => {
    if (voucher.discount_type === VoucherDiscountType.PERCENTAGE) {
      return `${Math.floor(voucher.discount_value)}%`;
    }
    return vnd(voucher.discount_value);
  };

  const getDiscountLabel = (voucher: Voucher): string => {
    if (voucher.discount_type === VoucherDiscountType.PERCENTAGE) {
      return 'Giảm';
    }
    if (voucher.discount_type === VoucherDiscountType.CASH_BACK) {
      return 'Hoàn';
    }
    return 'Giảm';
  };

  const formatMinOrder = (minValue: number): string => {
    if (minValue <= 0) return '';
    return vnd(minValue);
  };

  const isAvailable = (voucher: Voucher): boolean => {
    const now = new Date();
    const start = new Date(voucher.start_date);
    const end = new Date(voucher.end_date);
    
    if (voucher.status !== VoucherStatus.ACTIVE) return false;
    if (now < start || now > end) return false;
    
    if (voucher.total_usage_limit && 
        voucher.total_used_count >= voucher.total_usage_limit) {
      return false;
    }
    
    if (voucher.collection_limit && 
        voucher.collected_count >= voucher.collection_limit) {
      return false;
    }

    return true;
  };

  const VoucherCard = ({ voucher }: { voucher: Voucher }) => {
    const available = isAvailable(voucher);
    const discountText = formatDiscount(voucher);
    const discountLabel = getDiscountLabel(voucher);

    return (
      <div
        className={`relative bg-white border border-gray-200 rounded-lg overflow-hidden ${
          !available ? 'opacity-50' : ''
        }`}
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
        
        <div className="flex p-3">
          <div className="flex-shrink-0 bg-blue-500 text-white rounded-lg p-3 min-w-[100px] text-center mr-3 flex flex-col justify-center items-center">
            <Ticket className="h-10 w-10" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-1">
              {`${discountLabel} ${discountText}`} {voucher.title ? `- ${voucher.title}` : ''}
            </h4>
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {voucher.description || `Giảm giá cho đơn hàng từ ${formatMinOrder(voucher.min_order_amount)}`}
              {voucher.max_discount_amount ? ` (Tối đa ${vnd(voucher.max_discount_amount)})` : ''}
            </p>
            
            <div className="space-y-1 text-xs text-gray-600 mb-2">
              {voucher.min_order_amount > 0 && (
                <div className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  <span>Đơn tối thiểu {formatMinOrder(voucher.min_order_amount)}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>HSD: {new Date(voucher.end_date).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>

         
          </div>
        </div>

        <div className="border-t border-dashed border-gray-200 h-2 relative">
          <div className="absolute -top-2 -left-2 w-4 h-4 bg-gray-50 rounded-full" />
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-gray-50 rounded-full" />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="h-5 w-5 text-blue-500" />
          <h3 className="text-base font-medium text-gray-800">Mã giảm giá</h3>
        </div>
        <div className="py-8 text-center text-sm text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h3 className="text-base font-medium text-gray-800">Mã giảm giá</h3>
        </div>
        <div className="py-8 text-center text-sm text-red-600">{error}</div>
      </div>
    );
  }

  if (vouchers.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-blue-500" />
            <h3 className="text-base font-medium text-gray-800">Mã giảm giá</h3>
          </div>
          {vouchers.length > 2 && (
            <button 
              onClick={() => setShowModal(true)}
              className="text-sm text-blue-500 hover:text-blue-600 font-medium"
            >
              Xem thêm
            </button>
          )}
        </div>

        <Carousel autoplay dots={{ className: 'custom-dots' }} className="voucher-carousel">
          {vouchers.map((voucher) => (
            <div key={voucher.id} className="px-1">
              <VoucherCard voucher={voucher} />
            </div>
          ))}
        </Carousel>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Tất cả mã giảm giá
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="grid gap-3">
                {vouchers.map((voucher) => (
                  <VoucherCard key={voucher.id} voucher={voucher} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .voucher-carousel .ant-carousel .slick-slide {
          text-align: center;
          height: auto;
          line-height: 160px;
          overflow: hidden;
        }
        .custom-dots {
          bottom: 10px;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}