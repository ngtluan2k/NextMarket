'use client';
import { Card, Typography, Spin, Button } from 'antd';
import { BarChartOutlined, BulbOutlined, DollarOutlined, LineChartOutlined, MoreOutlined, SwapOutlined } from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useEffect, useState } from 'react';
import {
  productService,
  DailyRevenueItem,
} from '../../../service/product.service';
const { Title, Text } = Typography;

interface ChartData {
  weekday: string;
  fullDate: string;
  sales: number;
  target?: number;
}

export default function SalesOverview({
  storeId,
  days = 7, // default 7
}: {
  storeId: number;
  days?: number;
}) {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [analysisVisible, setAnalysisVisible] = useState(false);
  const handleAnalysisClick = () => {
    setAnalysisVisible(!analysisVisible);
  };
  const renderSalesAnalysis = () => {
    if (!chartData.length) return null;

    const totalSales = chartData.reduce((sum, item) => sum + item.sales, 0);
    const totalTarget = chartData.reduce(
      (sum, item) => sum + (item.target ?? 0),
      0
    );

    // Tính % tăng/giảm
    const diff = totalSales - totalTarget;
    const percentChange = totalTarget > 0 ? (diff / totalTarget) * 100 : 100;

    // Dự đoán doanh thu kỳ tới (ví dụ dựa trên % tăng/giảm)
    const nextPeriodPrediction = totalSales * (1 + percentChange / 100);

    return (
      <div className="p-4 bg-gray-50 rounded-md text-sm space-y-2">
        <div>
          <BarChartOutlined /> <Text strong>Tổng doanh thu kỳ này:</Text> {totalSales.toLocaleString('vi-VN')} ₫
        </div>
        <div>
          <LineChartOutlined /><Text strong> Tổng doanh thu kỳ trước:</Text> {totalTarget.toLocaleString('vi-VN')} ₫
        </div>
        <div>
          <SwapOutlined /> <Text strong>Thay đổi:</Text> {diff.toLocaleString('vi-VN')} ₫ (
          {percentChange.toFixed(2)}%)
        </div>
        <div>
          <BulbOutlined /><Text strong> Dự đoán kỳ tới:</Text> {nextPeriodPrediction.toLocaleString('vi-VN')} ₫
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await productService.getDailyRevenue(storeId, days);

        const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (days - 1));
        startDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const daysArray: Date[] = [];
        for (
          let d = new Date(startDate);
          d <= today;
          d.setDate(d.getDate() + 1)
        ) {
          daysArray.push(new Date(d));
        }

        const formattedData: ChartData[] = daysArray
          .map((dateObj) => {
            const dayOfWeek = weekdays[dateObj.getDay()];
            const day = String(dateObj.getDate()).padStart(2, '0');
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const year = dateObj.getFullYear();

            // Tìm dữ liệu backend
            const thisItem = data.thisPeriod.find(
              (p) => new Date(p.date).toDateString() === dateObj.toDateString()
            );

            const prevDate = new Date(dateObj);
            prevDate.setDate(prevDate.getDate() - days);
            const prevItem = data.prevPeriod.find(
              (p) => new Date(p.date).toDateString() === prevDate.toDateString()
            );
            const prevFullDate = `${weekdays[prevDate.getDay()]}, ${String(
              prevDate.getDate()
            ).padStart(2, '0')}-${String(prevDate.getMonth() + 1).padStart(
              2,
              '0'
            )}-${prevDate.getFullYear()}`;

            return {
              weekday: dayOfWeek,
              fullDate: `${dayOfWeek}, ${day}-${month}-${year}`,
              prevFullDate: prevFullDate,
              sales: thisItem?.revenue ?? 0,
              target: prevItem?.revenue ?? 0,
            };
          })
          .filter((item) => item.sales > 0); // chỉ giữ những ngày có doanh thu > 0

        setChartData(formattedData);
        console.log('Biểu đồ doanh thu:', formattedData);
      } catch (error) {
        console.error('Lỗi khi lấy doanh thu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId, days]);

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center">
        <Spin tip="Đang tải dữ liệu..." />
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Title level={4} className="!mb-1">
            Tổng Quan Doanh Thu
          </Title>
          <Text className="text-cyan-500 cursor-pointer">
            Xem phân tích chi tiết
          </Text>
        </div>
        <MoreOutlined className="text-gray-400 cursor-pointer" />
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <XAxis
              dataKey="fullDate"
              axisLine={false}
              tickLine={false}
              className="text-xs"
              tickFormatter={(fullDate) => {
                // fullDate = "T2, 12-11-2025"
                return fullDate.split(',')[0]; // chỉ lấy "T2"
              }}
            />

            <YAxis axisLine={false} tickLine={false} className="text-xs" />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const current =
                    payload.find((p) => p.dataKey === 'sales')?.value ?? 0;
                  const prev =
                    payload.find((p) => p.dataKey === 'target')?.value ?? 0;
                  const data = payload[0].payload;

                  return (
                    <div className="bg-white border p-2 rounded shadow-md text-sm">
                      <div>
                        {' '}
                        <DollarOutlined style={{ color: 'green' }} /> Doanh Thu:{' '}
                      </div>
                      {/* Ngày đang hover */}
                      <div className="font-semibold mb-1">{data.fullDate}</div>

                      {/* Tổng tiền tuần này */}
                      <div className="mb-1">
                        Tổng:{' '}
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(current)}
                      </div>

                      {/* So với */}
                      <div className="text-gray-500 mb-1">
                        So với: {data.prevFullDate}
                      </div>

                      {/* Tổng tiền tuần trước */}
                      <div>
                        Tổng:{' '}
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(prev)}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Bar dataKey="sales" fill="#0891b2" radius={[4, 4, 0, 0]} />
            <Bar dataKey="target" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
          <Text className="text-sm text-gray-600">
            {days > 7 ? 'Tháng Này' : 'Tuần Này'}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <Text className="text-sm text-gray-600">
            {days > 7 ? 'Tháng Trước' : 'Tuần Trước'}
          </Text>
        </div>
      </div>
      {/* ====== Chỗ để thêm phân tích AI ====== */}
      <div className="mt-4">
        <Button type="primary" onClick={handleAnalysisClick}>
          Phân tích doanh thu
        </Button>

        {analysisVisible && renderSalesAnalysis()}
        
      </div>
    </Card>
  );
}
