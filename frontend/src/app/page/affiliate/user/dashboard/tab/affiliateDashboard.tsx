'use client';

import { useEffect, useState } from 'react';

import {
  Wallet,
  Users,
  TrendingUp,
  Link,
} from 'lucide-react';
import { Button, Spin } from 'antd';
import { Card } from 'antd';
import { WalletTransactionHistory } from '../../../../../components/affiliate/dashboard/WalletTransactionHistory';
import { 
  getDashboardStats, 
  getBalance, 
} from "../../../../../../service/afiliate/affiliate-links.service";
import { fetchMyWallet } from '../../../../../../service/wallet.service';
import { BalanceInfo, DashboardStats } from '../../../../../types/affiliate-links';

export function AffiliateDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardData, balanceData, wallet] = await Promise.all([
          getDashboardStats(),
          getBalance(),
          fetchMyWallet()
        ]);
        
        console.log('🔍 Dashboard data received:', {
          dashboardData,
          balanceData,
          wallet
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

    fetchData();

    // Listen for commission events to refresh dashboard
    const handleCommissionEarned = () => {
      console.log('💰 Commission earned - refreshing dashboard...');
      fetchData();
    };

    const handleCommissionPaid = () => {
      console.log('💵 Commission paid - refreshing dashboard...');
      fetchData();
    };

    const handleCommissionReversed = () => {
      console.log('⚠️ Commission reversed - refreshing dashboard...');
      fetchData();
    };

    // Add event listeners
    window.addEventListener('commission-earned', handleCommissionEarned);
    window.addEventListener('commission-paid', handleCommissionPaid);
    window.addEventListener('commission-reversed', handleCommissionReversed);

    // Cleanup
    return () => {
      window.removeEventListener('commission-earned', handleCommissionEarned);
      window.removeEventListener('commission-paid', handleCommissionPaid);
      window.removeEventListener('commission-reversed', handleCommissionReversed);
    };
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
    {
      title: 'Người mua từ liên kết',
      value: stats?.totalBuyers?.toString() || '0',
      icon: Users,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
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
        <Button onClick={() => window.location.reload()}>
          Thử lại
        </Button>
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
      <WalletTransactionHistory className="border-gray-200 shadow-sm" />
    </div>
  );
}

