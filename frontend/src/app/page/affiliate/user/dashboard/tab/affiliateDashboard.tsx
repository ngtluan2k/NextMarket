'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Wallet, Users, TrendingUp, Link, Bell } from 'lucide-react';
import { Button, Spin, message } from 'antd';
import { Card } from 'antd';
import { WalletTransactionHistory } from '../../../../../components/affiliate/dashboard/WalletTransactionHistory';
import {
  getDashboardStats,
  getBalance,
} from '../../../../../../service/afiliate/affiliate-links.service';
import { fetchMyWallet } from '../../../../../../service/wallet.service';
import {
  BalanceInfo,
  DashboardStats,
} from '../../../../../types/affiliate-links';
import { useNotifications } from '../../../../../../hooks/useNotificationSocket';
import { NotificationType } from '../../../../../../service/notification-socket.service';
import { useAuth } from '../../../../../context/AuthContext';
import TransactionStatistic from '../../../../../components/affiliate/dashboard/TransactionStatistic';

// Memoized stat card component
const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <Card className={`bg-${color}-50 border-${color}-200`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <Icon className={`w-8 h-8 text-${color}-600`} />
    </div>
  </Card>
);

export function AffiliateDashboard() {
  const { me } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize refresh function
  const refreshData = useCallback(async () => {
    try {
      const [statsData, balanceData, walletData] = await Promise.all([
        getDashboardStats(),
        getBalance(),
        fetchMyWallet(),
      ]);
      setStats(statsData);
      setBalance(balanceData);
      setWalletBalance(walletData?.balance || 0);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  }, []);

  // Setup notification handlers for real-time updates
  useNotifications(me?.id || null, {
    handlers: {
      [NotificationType.COMMISSION_EARNED]: (data) => {
        console.log('Commission earned notification received:', data);
        message.success({
          content: `🎉 Bạn vừa nhận ${data.amount?.toLocaleString(
            'vi-VN'
          )} coin hoa hồng từ đơn hàng ${data.orderNumber}!`,
          duration: 5,
        });
        refreshData();
      },

      [NotificationType.COMMISSION_PAID]: (data) => {
        console.log('Commission paid notification received:', data);
        message.success({
          content: `💰 ${data.amount?.toLocaleString(
            'vi-VN'
          )} coin đã được cộng vào ví của bạn!`,
          duration: 4,
        });
        refreshData();
      },

      [NotificationType.COMMISSION_REVERSED]: (data) => {
        console.log('⚠️ Commission reversed notification received:', data);
        message.warning({
          content: `⚠️ Hoa hồng ${data.amount?.toLocaleString(
            'vi-VN'
          )} coin từ đơn #${data.orderId} đã bị hoàn trả: ${data.reason}`,
          duration: 6,
        });
        refreshData();
      },
    },

    onNotification: (notification) => {
      console.log(
        'Dashboard received notification:',
        notification.type,
        notification
      );
    },
  });

  // Function to fetch/refresh dashboard data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [dashboardData, balanceData, wallet] = await Promise.all([
        getDashboardStats(),
        getBalance(),
        fetchMyWallet(),
      ]);

      console.log(' Dashboard data received:', {
        dashboardData,
        balanceData,
        wallet,
      });

      setStats(dashboardData);
      setBalance(balanceData);
      setWalletBalance(wallet.balance || 0);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const displayStats = [
    {
      title: 'Tổng doanh thu',
      value: `VND ${walletBalance.toFixed(2)}`,
      icon: Wallet,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Số liên kết đã tạo',
      value: stats?.totalLinks?.toLocaleString() || '0',
      icon: Link,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <div className="text-red-500 mb-4">⚠️ {error}</div>
        <Button onClick={() => window.location.reload()}>Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayStats.map((stat) => (
          <Card
            key={stat.title}
            className="border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.iconBg}`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 w-full">
        <WalletTransactionHistory className="border-gray-200 shadow-sm" />
        <div className="col-span-2">
          <TransactionStatistic />
        </div>
      </div>
    </div>
  );
}
