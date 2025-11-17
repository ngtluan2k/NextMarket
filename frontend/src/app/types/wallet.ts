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

export type TransactionType =
  | 'affiliate_commission'
  | 'withdrawal'
  | 'deposit'
  | 'refund'
  | 'bonus';

export interface ApiResponse {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}


export interface AggregatedTransaction {
  date: string;
  amount: number;
  commission: number;
  withdrawal: number;
  count: number;
}

export interface BalanceTransaction extends WalletTransaction {
  balance: number;
  amount: number;
  date: string;
}

export interface TransactionDistribution {
  name: string;
  value: number;
  type: TransactionType;
}

export interface ChartData {
  trend: AggregatedTransaction[];
  balance: BalanceTransaction[];
  distribution: TransactionDistribution[];
}                                                                                 