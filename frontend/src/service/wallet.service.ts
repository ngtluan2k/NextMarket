// service/wallet.service.ts
import axios from 'axios';

export type Wallet = {
  id: number;
  balance: number;
  currency: string;
  updated_at: string;
};

export const fetchMyWallet = async (): Promise<Wallet> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get('http://localhost:3000/wallets/me', {
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
