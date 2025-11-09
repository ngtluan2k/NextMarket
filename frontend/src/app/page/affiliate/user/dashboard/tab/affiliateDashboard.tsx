'use client';

import { useEffect, useState } from 'react';

import {
  Wallet,
  Users,
  TrendingUp,
  Copy,
  ExternalLink,
  Link,
} from 'lucide-react';
import { Button, Spin } from 'antd';
import { Card } from 'antd';
import { 
  getDashboardStats, 
  DashboardStats, 
  getBalance, 
  BalanceInfo, 
  getCommissionSummary, 
  CommissionSummaryPeriod 
} from "../../../../../../service/afiliate/affiliate-links.service";
import { fetchMyWallet } from '../../../../../../service/wallet.service';

const timeFilters = ['12 tháng', '30 ngày', '7 ngày', '24 giờ'];

export function AffiliateDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [balance, setBalance] = useState<BalanceInfo | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [commissionSummary, setCommissionSummary] = useState<CommissionSummaryPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [dashboardData, balanceData, wallet, summaryData] = await Promise.all([
          getDashboardStats(),
          getBalance(),
          fetchMyWallet(),
          getCommissionSummary('monthly', 6)
        ]);
        
        console.log('🔍 Dashboard data received:', {
          dashboardData,
          balanceData,
          wallet,
          summaryData
        });
        
        setStats(dashboardData);
        setBalance(balanceData);
        setWalletBalance(wallet.balance || 0);
        setCommissionSummary(summaryData);
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
      value: `VND ${stats?.totalRevenue || '0.00'}`,
      change: '0.0%',
      icon: Wallet,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Số liên kết đã tạo',
      value: stats?.totalLinks?.toLocaleString() || '0',
      change: '0.0%',
      icon: Link,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Người mua từ liên kết',
      value: stats?.totalBuyers?.toString() || '0',
      change: '0.0%',
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
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Số dư ví của bạn</p>
                <p className="text-3xl font-bold text-gray-900">VND {walletBalance.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Hoa hồng khả dụng</p>
                <p className="text-3xl font-bold text-green-600">VND {balance?.availableBalance?.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-gray-500">VND {balance?.pendingBalance?.toFixed(2) || '0.00'} đang chờ</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            Có gì mới?
          </Button>
          <Button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
            Giới thiệu - 0
          </Button>
          <Button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
            <Copy className="h-4 w-4 mr-2" />
            Sao chép liên kết
          </Button>
          <Button className="bg-white border border-gray-200 text-gray-700 hover:bg-gray-50">
            Truy cập cửa hàng
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

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
                <span>{stat.change}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      <Card className="border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-600 mb-1">Số dư khả dụng</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold text-gray-900">VND {stats?.totalPaid || '0.00'}</p>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                VND {stats?.totalPending || '0.00'} pending
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {timeFilters.map((filter) => (
              <Button
                key={filter}
                size="small"
                className={`text-sm ${
                  filter === '12 tháng'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {filter}
              </Button>
            ))}
            <Button size="small" className="text-gray-600 hover:bg-gray-50">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              Bộ lọc
            </Button>
          </div>
        </div>

        {commissionSummary.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Lịch sử hoa hồng theo tháng</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {commissionSummary.map((period, index) => (
                <Card key={index} className="border-gray-200 shadow-sm">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-600">{period.period}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Tổng thu:</span>
                        <span className="text-sm font-medium text-green-600">
                          VND {period.totalEarned.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Đã trả:</span>
                        <span className="text-sm font-medium">VND {period.totalPaid.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Đang chờ:</span>
                        <span className="text-sm font-medium text-orange-600">
                          VND {period.totalPending.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Đơn hàng:</span>
                        <span className="text-sm font-medium">{period.totalOrders}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 opacity-20">
              <svg
                className="h-32 w-32 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Danh mục đầu tư của bạn không có doanh thu
            </h3>
            <p className="text-gray-600 max-w-md">
              Khi mọi người bắt đầu mua hàng qua liên kết của bạn, doanh thu và
              biểu đồ sẽ xuất hiện tại đây.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

