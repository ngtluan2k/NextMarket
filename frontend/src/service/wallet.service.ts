import axios from 'axios';
import { API_BASE_URL } from '../app/api/api';
import { Wallet, WalletTransactionsResponse } from '../app/types/wallet';

export const fetchMyWallet = async (): Promise<Wallet> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API_BASE_URL}/wallets/me`, {
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

export const fetchMyWalletTransactions = async (
  page = 1,
  limit = 20
): Promise<WalletTransactionsResponse> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${API_BASE_URL}/wallets/transactions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: { page, limit },
    });
    return res.data;
  } catch (err) {
    console.error('Failed to fetch wallet transactions:', err);
    throw err;
  }
};
