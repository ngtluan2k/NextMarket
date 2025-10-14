import React, { useState } from "react";
import { Button } from "antd";
import { X, ChevronRight, ChevronLeft } from "lucide-react"; // Icons
import cn from "classnames"; // Dùng để gộp các class trong JSX

interface XuModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAmount: number; // Nhận giá trị selectedAmount từ trang ShopXuPage
}

type PaymentMethod = {
  id: string;
  name: string;
  description?: string;
  icon: string;
};

const paymentMethods: PaymentMethod[] = [
  {
    id: "momo",
    name: "Ví MoMo",
    description: "Thanh toán nhanh qua Ví MoMo",
    icon: "/momo.png", // Đảm bảo ảnh nằm trong thư mục public
  },
  {
    id: "zalopay",
    name: "Ví ZaloPay",
    description: "Thanh toán qua ZaloPay",
    icon: "/zalo.png", // Đảm bảo ảnh nằm trong thư mục public
  },
  {
    id: "atm",
    name: "Thẻ ATM",
    description: "Hỗ trợ Internet Banking",
    icon: "/1.png", // Đảm bảo ảnh nằm trong thư mục public
  },
  {
    id: "vnpay",
    name: "VNPAY",
    description: "Thanh toán qua ứng dụng ngân hàng",
    icon: "/vnpay.png", // Đảm bảo ảnh nằm trong thư mục public
  },
];

export function XuModal({ isOpen, onClose, selectedAmount }: XuModalProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  if (!isOpen) return null;

  const handlePayment = () => {
    // Handle payment logic here
    console.log("Processing payment...");
    onClose(); // Close modal after payment processing
  };

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    setShowPaymentMethods(false); // Hide payment methods list after selection
  };

  const getSelectedPaymentMethodName = () => {
    const method = paymentMethods.find((m) => m.id === selectedPaymentMethod);
    return method ? method.name : "Chọn phương thức thanh toán";
  };

  const selectedMethod = paymentMethods.find(
    (method) => method.id === selectedPaymentMethod
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-auto shadow-2xl">
        {!showPaymentMethods ? (
          // Main Modal View
          <>
            {/* Header */}
            <div className="relative p-6 pb-4">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>

              {/* TikiXu Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <div className="text-2xl">🪙</div>
                </div>
              </div>

              {/* Title and Details */}
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Nạp Xu</h2>
                <p className="text-sm text-gray-600 mb-2">SL: 1</p>
                <p className="text-2xl font-bold text-gray-900">
                  {selectedAmount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                </p>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="px-6 py-4">
              <button
                onClick={() => setShowPaymentMethods(true)}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-lg border transition-colors",
                  selectedPaymentMethod ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center">
                  {/* Hiển thị ảnh phương thức thanh toán đã chọn */}
                  {selectedPaymentMethod && selectedMethod && (
                    <img
                      src={selectedMethod.icon}
                      alt={selectedMethod.name}
                      className="w-8 h-8 mr-2 object-contain"
                    />
                  )}
                  <span className="text-gray-700 font-medium">{getSelectedPaymentMethodName()}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Total */}
            <div className="px-6 py-2">
              <div className="flex justify-between items-center py-3 border-t border-gray-100">
                <span className="text-gray-700 font-medium">Tổng tiền</span>
                <span className="text-xl font-bold text-gray-900">
                  {selectedAmount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                </span>
              </div>
            </div>

            {/* Terms */}
            <div className="px-6 py-2">
              <p className="text-xs text-gray-500 leading-relaxed">
                Bằng việc tiến hành giao dịch, bạn đồng ý với điều khoản sử dụng dịch vụ.{" "}
                <button className="text-blue-600 hover:text-blue-700 underline">Xem thêm tại đây</button>.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 p-6 pt-4">
              <Button
                variant="outlined"
                onClick={onClose}
                className="flex-1 h-12 text-gray-700 border-gray-300 hover:bg-gray-50 bg-transparent"
              >
                Hủy
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Thanh toán
              </Button>
            </div>
          </>
        ) : (
          // Payment Methods Selection View
          <>
            {/* Payment Methods Header */}
            <div className="flex items-center p-6 pb-4 border-b border-gray-100">
              <button
                onClick={() => setShowPaymentMethods(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors mr-3"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">Chọn phương thức thanh toán</h2>
            </div>

            {/* Payment Methods List */}
            <div className="p-6">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Phương thức thanh toán khác</h3>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => handlePaymentMethodSelect(method.id)}
                    className="w-full flex items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-left"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-gray-300 mr-4 flex-shrink-0">
                      {selectedPaymentMethod === method.id && <div className="w-3 h-3 rounded-full bg-blue-600"></div>}
                    </div>
                    <div className="flex items-center flex-1">
                      <div className="w-8 h-8 flex items-center justify-center mr-3">
                        <img src={method.icon} alt={method.name} className="w-full h-full object-contain" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{method.name}</div>
                        {method.description && <div className="text-sm text-gray-500">{method.description}</div>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}