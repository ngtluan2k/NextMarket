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
      const transactions = apiResponse.transactions;

      setChartData({
        trend: aggregateByDate(transactions),
        balance: calculateRunningBalance(transactions),
        distribution: groupByType(transactions),
      });
    }
  }, [apiResponse]);

  return chartData;
};