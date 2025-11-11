// service/wallet.service.ts
import axios from 'axios';
const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

export type Wallet = {
  id: number;
  balance: number;
  currency: string;
  updated_at: string;
};

export const fetchMyWallet = async (): Promise<Wallet> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${BE_BASE_URL}/wallets/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (err) {
    console.error('Failed to fetch wallet:', err);
    throw err;
  }
};
