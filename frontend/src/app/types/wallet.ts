export type Wallet = {
  id: number;
  balance: number;
  currency: string;
  updated_at: string;
};

export type WalletTransaction = {
  id: number;
  uuid: string;
  wallet_id: number;
  type: string;
  amount: number;
  reference?: string;
  description?: string;
  created_at: string;
};

export type WalletTransactionsResponse = {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
