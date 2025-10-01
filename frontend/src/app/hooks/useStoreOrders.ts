import { useEffect, useState } from 'react';
import { orderService } from '../../service/order.service';
import { storeService } from '../../service/store.service';

export function useMyStoreOrders() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        setLoading(true);
        // gọi API lấy store từ user login
        const store = await storeService.getMyStore();
        if (!store?.id) throw new Error('Không tìm thấy store cho user');

        // lấy order theo storeId
        const data = await orderService.getOrdersByStore(store.id);
        setSales(data); // ✅ chỗ này
      } catch (err: any) {
        setError(err.message || 'Lỗi khi load đơn hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchSales();
  }, []);

  return { sales, loading, error };
}


