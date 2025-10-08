// hooks/useUseSubscription.ts
import { useState } from 'react';
import { useSubscriptionApi } from '../../service/subscriptionService';
import { UseSubscriptionBody, UseSubscriptionResponse } from '../types/subscription';

export function useUseSubscription() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UseSubscriptionResponse | null>(null);

  // Call the hook at the top level
  const subscriptionApi = useSubscriptionApi;

  const execute = async (body: UseSubscriptionBody) => {
    setLoading(true);
    setError(null);
    try {
      const res = await subscriptionApi(body);
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to use subscription');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error, result };
}
