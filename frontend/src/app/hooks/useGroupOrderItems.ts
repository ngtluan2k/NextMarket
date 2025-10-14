import { useCallback, useEffect, useState } from 'react';
import { groupOrderItemsApi, GroupOrderItemPayload } from '../../service/groupOrderItems.service';

export function useGroupOrderItems(groupId?: number | null) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const data = await groupOrderItemsApi.list(groupId);
      setItems(Array.isArray(data) ? data : data?.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const addItem = useCallback(async (payload: GroupOrderItemPayload) => {
    if (!groupId) throw new Error('Missing groupId');
    await groupOrderItemsApi.add(groupId, payload);
    await refresh();
  }, [groupId, refresh]);

  const updateItem = useCallback(async (itemId: number, payload: Partial<Omit<GroupOrderItemPayload, 'productId'>>) => {
    if (!groupId) throw new Error('Missing groupId');
    await groupOrderItemsApi.update(groupId, itemId, payload);
    await refresh();
  }, [groupId, refresh]);

  const removeItem = useCallback(async (itemId: number) => {
    // ❌ BỎ userId parameter - BE lấy từ JWT
    if (!groupId) throw new Error('Missing groupId');
    await groupOrderItemsApi.remove(groupId, itemId);
    await refresh();
  }, [groupId, refresh]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { items, loading, refresh, addItem, updateItem, removeItem };
}