import { useEffect, useState } from 'react';
import { fetchStoreSubscriptions } from '../../service/subscriptionService';
import { storeService } from '../../service/store.service';
import { Subscription } from '../types/subscription';

export function useStoreSubscriptions(storeId?: number) {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setLoading(true);
        let id = storeId;

        // 🧠 Nếu không truyền storeId từ ngoài vào thì tự gọi getMyStore()
        if (!id) {
          const store = await storeService.getMyStore();
          id = store?.id;
          console.log('🧩 Lấy storeId tự động từ getMyStore():', id);
        }

        if (!id) {
          setError('Không tìm thấy cửa hàng');
          setLoading(false);
          return;
        }

        console.log('🔍 Fetching subscriptions for storeId:', id);
        const data = await fetchStoreSubscriptions(id);
        setSubscriptions(data);
      } catch (e: any) {
        console.error('❌ Lỗi tải subscriptions:', e);
        setError(e.response?.data?.message || 'Không thể tải danh sách gói');
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptions();
  }, [storeId]);

  return { subscriptions, loading, error };
}
