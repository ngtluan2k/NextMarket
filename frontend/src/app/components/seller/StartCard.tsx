'use client';
import { Card, Typography, Progress } from 'antd';

const { Title, Text } = Typography;

export default function StatsCards() {
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <Text className="text-gray-500 text-sm">Doanh Thu Bán Hàng</Text>
            <Title level={3} className="!mb-0 !text-gray-900">
              2192945000 ₫
            </Title>
            <Text className="text-green-500 text-sm">↗ 12.3%</Text>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <Text className="text-gray-500 text-sm">Số Lượng Bán</Text>
            <Title level={3} className="!mb-0 !text-gray-900">
              1584
            </Title>
            <Text className="text-red-500 text-sm">↘ 5.8%</Text>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <Text className="text-gray-500 text-sm">
              Giá trị đơn hàng trung bình
            </Text>
            <Title level={4} className="!mb-0 !text-gray-900">
              736000 ₫
            </Title>
          </div>
          <div>
            <Text className="text-gray-500 text-sm">
              Số lượng đơn hàng trung bình
            </Text>
            <Title level={4} className="!mb-0 !text-gray-900">
              2.60
            </Title>
          </div>
        </div>
      </Card>
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16">
            <Progress
              type="circle"
              percent={87}
              size={64}
              strokeColor="#10b981"
              trailColor="#f3f4f6"
              strokeWidth={8}
              format={() => (
                <span className="text-lg font-bold text-gray-900">87%</span>
              )}
            />
          </div>
          <div>
            <Title level={4} className="!mb-0 !text-gray-900">
              2192945000 ₫
            </Title>
            <Text className="text-gray-500 text-sm">
              / 2760000000 ₫ Mục tiêu
            </Text>
            <div className="text-gray-500 text-sm">
              Doanh thu bán hàng trong kỳ
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
