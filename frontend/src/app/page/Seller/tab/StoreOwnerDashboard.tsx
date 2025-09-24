'use client';
import { Layout, Typography, Select, Button, Modal,message } from 'antd';
import { ExportOutlined, DeleteOutlined } from '@ant-design/icons';
import SalesOverview from '../../../components/seller/SaleOverview';
import StatsCards from '../../../components/seller/StartCard';
import TopSellingProducts from '../../../components/seller/TopSellingProducts';
import InventoryOverview from '../../../components/seller/InventoryOverview';
import { Content } from 'antd/es/layout/layout';
import { useState } from 'react';

const { Title, Text } = Typography;

export default function StoreOwnerDashboard() {
  const [loading , setLoading]= useState (false);

  const handleDeleteStore = async () => {
    Modal.confirm({
      title: '⚠️ Xác nhận xóa cửa hàng',
      content: (
        <div>
          <p>
            Bạn có chắc chắn muốn <strong>XÓA VĨNH VIỄN</strong> cửa hàng này?
          </p>
          
        </div>
      ),
      okText: 'Xóa Ngay',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          setLoading(true);
          const token = localStorage.getItem('token');
          const res = await fetch('http://localhost:3000/stores/my-store', {
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
            message.error(`❌ Lỗi: ${data.message || 'Không thể xóa cửa hàng'}`);
          }
        } catch (error) {
          message.error('❌ Lỗi kết nối. Vui lòng thử lại.');
        } finally {
          setLoading(false);
        }
      },
    });
  };

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
            <Select defaultValue="7 Ngày Qua" className="w-32">
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
            <SalesOverview />
          </div>
          <StatsCards />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TopSellingProducts />
          </div>
          <InventoryOverview />
        </div>
      </Content>
    </Layout>
  );
}
