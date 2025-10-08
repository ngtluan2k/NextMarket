// hooks/useMySubscriptions.ts
import { useState, useEffect } from 'react';
import { Subscription } from '../types/subscription';
import { fetchMySubscriptions } from '../../service/subscriptionService';

export function useMySubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMySubscriptions();
      setSubscriptions(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to load subscriptions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscriptions();
  }, []);

  return { subscriptions, loading, error, reload: loadSubscriptions };
}
