'use client';
import { Card, Typography } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell } from 'recharts';

const { Title, Text } = Typography;

const inventoryData = [
  { name: 'Còn hàng', value: 2456, color: '#0891b2' },
  { name: 'Tồn kho thấp', value: 158, color: '#f59e0b' },
  { name: 'Hết hàng', value: 24, color: '#e5e7eb' },
];

export default function InventoryOverview() {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Title level={4} className="!mb-1">
            Tổng Quan Tồn Kho
          </Title>
          <Text className="text-cyan-500 cursor-pointer">Xem tồn kho</Text>
        </div>
        <MoreOutlined className="text-gray-400 cursor-pointer" />
      </div>
      <div className="flex justify-center mb-4">
        <div className="relative w-32 h-32">
          <PieChart width={128} height={128}>
            <Pie
              data={inventoryData}
              cx={64}
              cy={64}
              innerRadius={40}
              outerRadius={64}
              dataKey="value"
              startAngle={90}
              endAngle={450}
            >
              {inventoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-cyan-600 rounded-full"></div>
            <Text className="text-sm">2456 Còn hàng</Text>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <Text className="text-sm">158 Tồn kho thấp</Text>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <Text className="text-sm">24 Hết hàng</Text>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <Text className="text-gray-500 text-sm">Tổng Sản Phẩm</Text>
          <Text className="font-semibold">2638</Text>
        </div>
        <div className="flex justify-between items-center">
          <Text className="text-gray-500 text-sm">Trạng Thái</Text>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Tốt
          </span>
        </div>
      </div>
    </Card>
  );
}