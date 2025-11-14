import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useTransactionData } from '../../../hooks/useTransaction';
import {
  formatCurrency,
  getTransactionTypeDisplay,
  calculateTotalAmount,
} from '../../../../utils/chart-helper';
import { ApiResponse } from '../../../types/wallet';
import { fetchMyWalletTransactions } from '../../../../service/wallet.service';

const COLORS: string[] = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

const TransactionStatistic = () => {
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const chartData = useTransactionData(apiResponse);

  console.log('Chart data: ', JSON.stringify(chartData, null, 2));
  // Fetch data from backend
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMyWalletTransactions();
        setApiResponse(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 font-semibold">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalAmount = calculateTotalAmount(apiResponse?.transactions || []);

  return (
    <div>
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 pb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600">Total Commission</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600">Transactions</p>
          <p className="text-2xl font-bold text-green-600">
            {apiResponse?.total || 0}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-xs text-gray-600">Avg Transaction</p>
          <p className="text-2xl font-bold text-purple-600">
            {formatCurrency(totalAmount / (apiResponse?.total || 1))}
          </p>
        </div>
      </div>
      <div className="col-span-2 space-y-6 overflow-y-auto max-h-screen pr-4">
        {/* Line Chart - Daily Trend */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-700 mb-4">
            Daily Transaction Trend
          </h3>
          {chartData.trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="commission"
                  stroke="#3b82f6"
                  name="Commission"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="withdrawal"
                  stroke="#ef4444"
                  name="Withdrawal"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              No data available
            </div>
          )}
        </div>

        {/* Area Chart - Running Balance */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-700 mb-4">
            Wallet Balance Over Time
          </h3>
          {chartData.balance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.balance}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-400">
              No data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default TransactionStatistic;
