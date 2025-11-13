'use client';
import { Card, Typography, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { productService } from '../../../service/product.service';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface StatsCardsProps {
  storeId: number;
  days?: number; // 7 hoặc 30
}

function calcChange(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((current - prev) / prev) * 100);
}

export default function StatsCards({ storeId, days = 7 }: StatsCardsProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalRevenue: number;
    prevRevenue: number;
    totalOrders: number;
    prevOrders: number;
    avgOrderValue: number;
    prevAvgOrderValue: number;
    avgItemsPerOrder: number;
    prevAvgItemsPerOrder: number;
  } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await productService.getDailyRevenue(storeId, days);

        const sumRevenue = (arr: any[]) =>
          arr.reduce((sum, x) => sum + Number(x.revenue), 0);

        const totalRevenue = sumRevenue(data.thisPeriod);
        const prevRevenue = sumRevenue(data.prevPeriod);

        const totalOrders = data.thisPeriod.length;
        const prevOrders = data.prevPeriod.length;

        const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;
        const prevAvgOrderValue = prevOrders ? prevRevenue / prevOrders : 0;

        // Tính trung bình sản phẩm / đơn hàng
        const sumItems = (arr: any[]) =>
          arr.reduce((sum, x) => sum + Number(x.quantity ?? 1), 0);
        const avgItemsPerOrder = totalOrders
          ? sumItems(data.thisPeriod) / totalOrders
          : 0;
        const prevAvgItemsPerOrder = prevOrders
          ? sumItems(data.prevPeriod) / prevOrders
          : 0;

        setStats({
          totalRevenue,
          prevRevenue,
          totalOrders,
          prevOrders,
          avgOrderValue,
          prevAvgOrderValue,
          avgItemsPerOrder,
          prevAvgItemsPerOrder,
        });
        console.log('Stats:', {
          totalRevenue,
          prevRevenue,
          totalOrders,
          prevOrders,
          avgOrderValue,
          prevAvgOrderValue,
          avgItemsPerOrder,
          prevAvgItemsPerOrder,
        });
      } catch (error) {
        console.error('Lỗi khi lấy stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [storeId, days]);

  if (loading || !stats) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Spin tip="Đang tải dữ liệu..." />
      </Card>
    );
  }

  const changeRevenue = calcChange(stats.totalRevenue, stats.prevRevenue);
  const changeOrders = calcChange(stats.totalOrders, stats.prevOrders);
  const changeAvgValue = calcChange(
    stats.avgOrderValue,
    stats.prevAvgOrderValue
  );
  const changeAvgItems = calcChange(
    stats.avgItemsPerOrder,
    stats.prevAvgItemsPerOrder
  );

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <Text className="text-gray-500 text-sm">Doanh Thu Bán Hàng</Text>

        <div className="flex items-baseline gap-4 mt-1">
          {/* Doanh thu hiện tại */}
          <Title level={3} className="!mb-0 !text-gray-900 inline-block">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(stats.totalRevenue)}
          </Title>
          {changeRevenue !== null && (
          <div className="mt-1">
            <Text
              className={`font-semibold ${
                changeRevenue >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {changeRevenue >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{' '}
              {Math.abs(changeRevenue)}%
            </Text>
          </div>
        )}
        </div>
        
        {/* So với kỳ trước */}
        <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
          <span>So với kỳ trước:</span>
          <Title level={5} className="!mb-0 !text-gray-900">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(stats.prevRevenue)}
          </Title>
        </div>
      </Card>

      <Card className="p-4">
        <Text className="text-gray-500 text-sm">Số Lượng Đơn Hàng</Text>

        <div className="flex items-baseline gap-4 mt-1">
          <Title level={3} className="!mb-0 !text-gray-900 inline-block">
            {stats.totalOrders}
          </Title>
          {changeOrders !== null && (
            <Text
              className={`font-semibold ${
                changeOrders >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {changeOrders >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}{' '}
              {Math.abs(changeOrders)}%
            </Text>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
          <span>So với kỳ trước:</span>
          <Title level={5} className="!mb-0 !text-gray-900">
            {stats.prevOrders}
          </Title>
        </div>
      </Card>

      <Card className="p-4">
        <Text className="text-gray-500 text-sm">
          Giá trị đơn hàng trung bình
        </Text>

        <div className="flex items-baseline gap-4 mt-1">
          <Title level={4} className="!mb-0 !text-gray-900 inline-block">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(stats.avgOrderValue)}
          </Title>
          {changeAvgValue !== null && (
            <Text
              className={`font-semibold ${
                changeAvgValue >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {changeAvgValue >= 0 ? (
                <ArrowUpOutlined />
              ) : (
                <ArrowDownOutlined />
              )}{' '}
              {Math.abs(changeAvgValue)}%
            </Text>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2 text-gray-500 text-sm">
          <span>So với kỳ trước:</span>
          <Title level={5} className="!mb-0 !text-gray-900">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(stats.prevAvgOrderValue)}
          </Title>
        </div>
      </Card>
    </div>
  );
}
