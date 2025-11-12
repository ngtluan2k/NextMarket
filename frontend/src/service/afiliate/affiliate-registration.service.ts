import axios from 'axios';
import { BE_BASE_URL } from '../../app/api/api';

export interface AffiliateRegistration {
  id: number;
  uuid: string;
  user_full_name: string;
  user_email: string;
  phone: string;
  createdAt: string | number | Date;
  registered_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

interface AffiliateRegistrationsResponse {
  data?: AffiliateRegistration[];
}

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found!');
  }
  return { Authorization: `Bearer ${token}` };
};
export async function getAffiliateRegistrations(): Promise<
  AffiliateRegistration[]
> {
  const res = await axios.get<
    AffiliateRegistration[] | AffiliateRegistrationsResponse
  >(`${BE_BASE_URL}/affiliate-registrations`, {
    headers: getAuthHeaders(),
  });

  const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
  return data;
}

export async function approveRegistration(id: number): Promise<void> {
  await axios.patch(
    `${BE_BASE_URL}/affiliate-registrations/${id}/approve`,
    {},
    { headers: getAuthHeaders() }
  );
}

export async function rejectRegistration(id: number): Promise<void> {
  await axios.patch(
    `${BE_BASE_URL}/affiliate-registrations/${id}/reject`,
    {},
    { headers: getAuthHeaders() }
  );
}
