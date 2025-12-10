// utils/transactionUtils.ts

import { WalletTransaction, AggregatedTransaction, BalanceTransaction, TransactionDistribution} from "../app/types/wallet";

// Format ngày (VN format)
export const formatDateVN = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

// Aggregate transactions by date
export const aggregateByDate = (transactions: WalletTransaction[]): AggregatedTransaction[] => {
  if (!transactions || !Array.isArray(transactions)) {
    return [];
  }

  const grouped: Record<string, AggregatedTransaction> = {};

  transactions.forEach((tx) => {
    try {
      const date = formatDateVN(tx.created_at);

      if (!grouped[date]) {
        grouped[date] = {
          date,
          amount: 0,
          commission: 0,
          withdrawal: 0,
          count: 0,
        };
      }

      const amount = tx.amount || 0;
      grouped[date].amount += amount;

      // Since we're filtering by type in the hook, all transactions here should be affiliate_commission
      if (tx.type === 'affiliate_commission') {
        grouped[date].commission += amount;
      }

      grouped[date].count += 1;
    } catch (error) {
      console.warn('Error processing transaction:', tx, error);
    }
  });

  // Convert to array and sort by date
  return Object.values(grouped).sort((a, b) => {
    try {
      const dateA = new Date(a.date.split('/').reverse().join('-')); // Convert DD/MM/YYYY to YYYY-MM-DD
      const dateB = new Date(b.date.split('/').reverse().join('-'));
      return dateA.getTime() - dateB.getTime();
    } catch (error) {
      console.warn('Error sorting dates:', a.date, b.date, error);
      return 0;
    }
  });
};

// Calculate running balance
export const calculateRunningBalance = (transactions: WalletTransaction[]): BalanceTransaction[] => {
  if (!transactions || !Array.isArray(transactions)) {
    return [];
  }

  let balance = 0;

  return transactions
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((tx) => {
      try {
        const amount = tx.amount || 0;
        balance += tx.type === 'withdrawal' ? -amount : amount;

        return {
          ...tx,
          balance,
          amount: tx.amount,
          date: formatDateVN(tx.created_at),
        } as BalanceTransaction;
      } catch (error) {
        console.warn('Error processing balance transaction:', tx, error);
        return {
          ...tx,
          balance,
          amount: 0,
          date: formatDateVN(tx.created_at || new Date().toISOString()),
        } as BalanceTransaction;
      }
    });
};

// Group by transaction type
export const groupByType = (transactions: WalletTransaction[]): TransactionDistribution[] => {
  if (!transactions || !Array.isArray(transactions)) {
    return [];
  }

  const grouped: Record<string, number> = {};

  transactions.forEach((tx) => {
    try {
      if (!grouped[tx.type]) {
        grouped[tx.type] = 0;
      }
      grouped[tx.type] += tx.amount || 0;
    } catch (error) {
      console.warn('Error grouping transaction:', tx, error);
    }
  });

  return Object.entries(grouped).map(([name, value]) => ({
    name: translateType(name as any),
    value,
    type: name as any,
  }));
};

// Translate transaction type
const translateType = (type: string): string => {
  const translations: Record<string, string> = {
    affiliate_commission: 'Commission Affiliate',
    withdrawal: 'Rút Tiền',
    deposit: 'Nạp Tiền',
    refund: 'Hoàn Tiền',
    bonus: 'Thưởng',
  };
  return translations[type] || type;
};

// Format currency
export const formatCurrency = (value: number) => {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
};

// Get display text for transaction type
export const getTransactionTypeDisplay = (type: string): string => {
  return type.replace(/_/g, ' ').toUpperCase();
};

// Calculate total amount (only affiliate commission)
export const calculateTotalAmount = (transactions: WalletTransaction[] | undefined): number => {
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return 0;
  }
  return transactions
    .filter(tx => tx.type === 'affiliate_commission')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);
};