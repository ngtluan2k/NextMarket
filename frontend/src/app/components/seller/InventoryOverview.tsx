'use client';
import { useEffect, useState } from 'react';
import { Card, Typography, Spin } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell } from 'recharts';
import { productService } from '../../../service/product.service'; // path đúng của bạn

const { Title, Text } = Typography;

interface InventoryOverviewProps {
  storeId: number;
  days?: number; // số ngày muốn lấy, mặc định 7
}

export default function InventoryOverview({
  storeId,
  days = 7,
}: InventoryOverviewProps) {
  const [inventoryData, setInventoryData] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!storeId) return;

    async function fetchInventory() {
      try {
        setLoading(true);
        // Lấy sản phẩm theo storeId và khoảng ngày
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days + 1);

        const products = await productService.getStoreProducts(
          storeId,
          startDate.toISOString(),
          endDate.toISOString()
        );

        // Chỉ giữ sản phẩm active
        const activeProducts = products.filter(
          (p: any) => p.status === 'active' || p.status === 'draft'
        );

        // Tính tồn kho từ variants
        const computed = activeProducts.map((p: any) => {
          const totalStock =
            p.variants?.reduce(
              (sum: number, v: any) => sum + (v.stock ?? 0),
              0
            ) ?? 0;
          return { ...p, totalStock };
        });

        // Phân loại tồn kho
        const inStock = computed.filter((p: any) => p.totalStock > 20).length;
        const lowStock = computed.filter(
          (p: any) => p.totalStock > 0 && p.totalStock <= 20
        ).length;
        const outOfStock = computed.filter(
          (p: any) => p.totalStock === 0
        ).length;

        setInventoryData([
          { name: 'Còn hàng', value: inStock, color: '#0891b2' },
          { name: 'Tồn kho thấp', value: lowStock, color: '#f59e0b' },
          { name: 'Hết hàng', value: outOfStock, color: '#e5e7eb' },
        ]);

        setTotalProducts(inStock + lowStock + outOfStock);
        console.log('Dữ liệu tồn kho (active):', {
          inStock,
          lowStock,
          outOfStock,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchInventory();
  }, [storeId, days]);

  if (loading) {
    return (
      <Card className="flex justify-center items-center min-h-[200px]">
        <Spin />
      </Card>
    );
  }

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

      {/* Biểu đồ tròn */}
      <div className="flex justify-center mb-4">
        <div className="relative w-32 h-32">
          <PieChart width={140} height={140}>
            <Pie
              data={inventoryData}
              cx={64}
              cy={64}
              innerRadius={40}
              outerRadius={64}
              dataKey="value"
              startAngle={90} // bắt đầu từ trên
              endAngle={450} // ngược chiều kim đồng hồ
            >
              {inventoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </div>
      </div>

      {/* Thống kê chi tiết */}
      <div className="space-y-3">
        {inventoryData.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: item.color }}
              ></div>
              <Text className="text-sm">
                {item.value} {item.name}
              </Text>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <Text className="text-gray-500 text-sm">Tổng Sản Phẩm</Text>
          <Text className="font-semibold">{totalProducts}</Text>
        </div>
        <div className="flex justify-between items-center">
          <Text className="text-gray-500 text-sm">Trạng Thái</Text>
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            {inventoryData[2]?.value === 0 ? 'Tốt' : 'Cần Kiểm Tra'}
          </span>
        </div>
      </div>
    </Card>
  );
}
