import React, { useState, useEffect } from 'react';
import { Truck, Package, RefreshCcw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/api';
import { UserAddress } from '../../types/user';
import AddressModal from '../../page/AddressModal';

export default function Shipping() {
  const { me } = useAuth();
  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);

  // Lấy địa chỉ của người dùng
  useEffect(() => {
    const fetchAddresses = async () => {
      if (me?.id) {
        setLoading(true);
        try {
          const data = await userApi.getAddresses(me.id);
          // Chọn địa chỉ mặc định hoặc địa chỉ đầu tiên
          const defaultAddress =
            data.find((addr: UserAddress) => addr.isDefault) || data[0];
          setSelectedAddress(defaultAddress || null);
        } catch (err) {
          console.error('Lỗi khi lấy địa chỉ:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAddresses();
  }, [me]);

  const handleAddressSelect = (address: UserAddress) => {
    setSelectedAddress(address);
  };

  const displayAddress = selectedAddress
    ? `${selectedAddress.ward}, ${selectedAddress.district}, ${selectedAddress.province}`
    : 'Chưa có địa chỉ';

  return (
    <>
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-200">
        <h3 className="mb-2 text-base font-semibold text-slate-900">
          Thông tin vận chuyển
        </h3>
        <ul className="divide-y divide-slate-200 text-sm">
          <li className="flex items-start justify-between gap-2 py-3">
            <div className="flex items-start gap-2">
              <Truck className="mt-0.5 h-4 w-4 text-sky-600 flex-shrink-0" />
              <div>
                Giao đến{' '}
                {loading ? (
                  <span className="text-slate-400">Đang tải...</span>
                ) : (
                  <span className="font-medium">{displayAddress}</span>
                )}
              </div>
            </div>
            <button
              onClick={() => setIsAddressModalVisible(true)}
              className="text-sky-700 hover:underline flex-shrink-0"
            >
              Đổi
            </button>
          </li>
          <li className="flex items-start gap-2 py-3">
            <div className="mt-0.5 h-4 w-4" />
            <div>
              <span className="text-rose-600 font-semibold">NOW</span> Giao siêu
              tốc 2h —
              <span className="ml-1 text-emerald-600">Miễn phí hôm nay</span>
            </div>
          </li>
          <li className="flex items-start gap-2 py-3">
            <Package className="mt-0.5 h-4 w-4 text-indigo-600 flex-shrink-0" />
            <div>
              Giao đúng sáng mai —{' '}
              <span className="ml-1 text-emerald-600">Miễn phí</span>
            </div>
          </li>
          <li className="flex items-start gap-2 py-3">
            <RefreshCcw className="mt-0.5 h-4 w-4 text-slate-600 flex-shrink-0" />
            <div>Freeship 10k đơn từ 45k, Freeship 25k đơn từ 100k</div>
          </li>
        </ul>
      </div>

      {/* Address Modal - giống với navbar */}
      <AddressModal
        visible={isAddressModalVisible}
        onClose={() => setIsAddressModalVisible(false)}
        onSelect={handleAddressSelect}
        currentAddressId={selectedAddress?.id}
      />
    </>
  );
}