'use client';
import { Layout, Typography, Select, Button, Modal, message, Spin } from 'antd';
import { ExportOutlined, DeleteOutlined } from '@ant-design/icons';
import SalesOverview from '../../../components/seller/SaleOverview';
import StatsCards from '../../../components/seller/StartCard';
import TopSellingProducts from '../../../components/seller/TopSellingProducts';
import InventoryOverview from '../../../components/seller/InventoryOverview';
import { Content } from 'antd/es/layout/layout';
import { useState, useEffect } from 'react';

const { Title, Text } = Typography;

export default function StoreOwnerDashboard() {
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;
  const [loading, setLoading] = useState(false);
  const [store, setStore] = useState<{ id: number; name: string } | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [period, setPeriod] = useState<string>('7 Ngày Qua');

  useEffect(() => {
    const fetchStore = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${BE_BASE_URL}/stores/my-store`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result = await res.json();
        setStore(result.data); // giả sử BE trả về { id, name, ... }
        console.log('Thông tin cửa hàng:', result.data);
      } catch (error) {
        console.error(error);
        message.error('Không thể lấy thông tin cửa hàng');
      } finally {
        setStoreLoading(false);
      }
    };
    fetchStore();
  }, []);

  const handleDeleteStore = async () => {
    Modal.confirm({
      title: 'Xác nhận xóa cửa hàng',
      content: <p>Bạn có chắc chắn muốn xóa cửa hàng này?</p>,
      okText: 'Xóa Ngay',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          const res = await fetch(`${BE_BASE_URL}/stores/my-store`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await res.json();
          if (res.ok) {
            message.success(
              `✅ Xóa cửa hàng thành công! Bạn sẽ được chuyển về trang chủ.`
            );
            setTimeout(() => {
              window.location.href = '/';
            }, 1500);
          } else {
            message.error(
              `❌ Lỗi: ${data.message || 'Không thể xóa cửa hàng'}`
            );
          }
        } catch (error) {
          message.error('❌ Lỗi kết nối. Vui lòng thử lại.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  if (storeLoading) return <Spin size="large" className="m-20" />;

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Title level={2} className="!mb-1 !text-gray-900">
              Bảng Điều Khiển
            </Title>
            <Text className="text-gray-500">
              Tổng quan về hoạt động kinh doanh của bạn
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={period}
              onChange={(value) => setPeriod(value)}
              className="w-32"
            >
              <Select.Option value="7 Ngày Qua">7 Ngày Qua</Select.Option>
              <Select.Option value="30 Ngày Qua">30 Ngày Qua</Select.Option>
            </Select>
            <Button
              type="primary"
              icon={<ExportOutlined />}
              className="bg-cyan-500 border-cyan-500"
            >
              Xuất Dữ Liệu
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={loading}
              onClick={handleDeleteStore}
            >
              Xóa Cửa Hàng
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            {store && (
              <SalesOverview
                storeId={store.id}
                days={period === '7 Ngày Qua' ? 7 : 30}
              />
            )}
          </div>
          <div>
            {store && (
              <StatsCards
                storeId={store.id}
                days={period === '7 Ngày Qua' ? 7 : 30}
              />
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
           <TopSellingProducts 
           storeId={store?.id ?? 0}
           days={period === '7 Ngày Qua' ? 7 : 30}
            />
          </div>
          <InventoryOverview />
        </div>
      </Content>
    </Layout>
  );
}
