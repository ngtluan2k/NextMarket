// hooks/useTransactionData.ts

import { useState, useEffect } from 'react';
import { ApiResponse, ChartData } from '../types/wallet';
import {
  aggregateByDate,
  calculateRunningBalance,
  groupByType} from '../../utils/chart-helper';

export const useTransactionData = (apiResponse: ApiResponse | null): ChartData => {
  const [chartData, setChartData] = useState<ChartData>({
    trend: [],
    balance: [],
    distribution: [],
  });

  useEffect(() => {
    if (apiResponse?.transactions && apiResponse.transactions.length > 0) {
      // Filter only affiliate commission transactions for charts
      const commissionTransactions = apiResponse.transactions.filter(
        tx => tx.type === 'affiliate_commission'
      );

      setChartData({
        trend: aggregateByDate(commissionTransactions),
        balance: calculateRunningBalance(commissionTransactions),
        distribution: groupByType(commissionTransactions),
      });
    }
  }, [apiResponse]);

  return chartData;
};