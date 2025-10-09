// services/subscriptionService.ts
import axios from 'axios';
import {
  Subscription,
  UseSubscriptionBody,
  UseSubscriptionResponse,
} from '../app/types/subscription';

const API_BASE = 'http://localhost:3000/subscriptions';

export async function fetchMySubscriptions(): Promise<Subscription[]> {
  const token = localStorage.getItem('token');
  const res = await axios.get(`${API_BASE}/my-subscriptions`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

export async function useSubscriptionApi(
  body: UseSubscriptionBody
): Promise<UseSubscriptionResponse> {
  const token = localStorage.getItem('token');
  const res = await axios.post(`${API_BASE}/use`, body, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
