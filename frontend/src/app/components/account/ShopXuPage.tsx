import React, { useState } from "react";
import { Button, Input, Typography, Card } from "antd";
import { useNavigate } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { XuModal } from "./modal_account/PaymentMethodModal";


// Hàm định dạng tiền tệ
const formatCurrency = (amount: number) => {
  return amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" });
};

export default function ShopXuPage() {
  const [selectedAmount, setSelectedAmount] = useState(100000); 
  const [customAmount, setCustomAmount] = useState(""); 
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false); 
  const amounts = [100000, 200000, 500000, 1000000, 2000000]; 
  const navigate = useNavigate();

  // Cập nhật khi người dùng nhấn vào mức giá Xu
  const handleAmountChange = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(""); // Reset nhập tay khi chọn mức Xu
  };

  // Cập nhật khi người dùng nhập số tiền
  const handleCustomAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomAmount(e.target.value);
    setSelectedAmount(Number(e.target.value)); // Cập nhật giá trị Xu từ nhập tay
  };

  // Mở modal thanh toán
  const handleOpenPaymentModal = () => {
    setIsPaymentModalOpen(true);
  };

  // Đóng modal thanh toán
  const handleClosePaymentModal = () => {
    setIsPaymentModalOpen(false);
  };

  // Xử lý thanh toán
  const handleSubmit = () => {
    if (!selectedAmount || selectedAmount <= 0) {
      alert("Vui lòng chọn hoặc nhập số Xu cần nạp.");
      return;
    }
    handleOpenPaymentModal(); // Mở modal khi thông tin thanh toán hợp lệ
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <span className="text-gray-700">Số Xu trong tài khoản</span>
            <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">0</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <span> Xu là gì?</span>
            <HelpCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">😊</span>
              </div>
              <h1 className="text-xl font-medium text-gray-800">Nạp Xu vào tài khoản</h1>
            </div>

            {/* Blue Gradient Card */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 border-0 p-8">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 text-white/80">
                  <span>Nhập số Xu muốn nạp</span>
                </div>

                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full"></div>
                  </div>
                  <span className="text-white text-5xl font-bold">{formatCurrency(selectedAmount)}</span>
                </div>

                <div className="flex flex-wrap gap-3">
                  {amounts.map((amount) => (
                    <Button
                      key={amount}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        selectedAmount === amount
                          ? "bg-white text-blue-600 hover:bg-gray-100"
                          : "bg-white/10 text-white border-white/30 hover:bg-white/20"
                      }`}
                      onClick={() => handleAmountChange(amount)}
                    >
                      {formatCurrency(amount)}
                    </Button>
                  ))}
                </div>

                {/* Dòng nhập số tiền */}
                <div className="mt-6">
                  <Input
                    value={customAmount}
                    onChange={handleCustomAmountChange}
                    className="w-full mt-4"
                    type="number"
                    placeholder="Nhập số Xu muốn nạp"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="flex flex-col space-y-6 mt-[56px]">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Phí giao dịch:</span>
                  <span className="font-medium text-green-600">0%</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Số tiền cần thanh toán:</span>
                  <span className="font-bold text-lg">{formatCurrency(selectedAmount)} đ</span>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium"
                  onClick={handleSubmit}
                >
                  Tiến hành thanh toán
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal Thanh toán */}
      <XuModal
        isOpen={isPaymentModalOpen}
        onClose={handleClosePaymentModal}
        selectedAmount={selectedAmount} // Truyền selectedAmount vào modal
      />
    </div>
  );
}