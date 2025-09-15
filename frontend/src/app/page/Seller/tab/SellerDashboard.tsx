'use client';
import { Layout, Typography, Select, Button } from 'antd';
import { ExportOutlined } from '@ant-design/icons';
import DashboardHeader from '../../../components/seller/DashboardHeader';
import SalesOverview from '../../../components/seller/SaleOverview';
import StatsCards from '../../../components/seller/StartCard';
import TopSellingProducts from '../../../components/seller/TopSellingProducts';
import InventoryOverview from '../../../components/seller/InventoryOverview';
import { Content } from 'antd/es/layout/layout';

const { Title, Text } = Typography;

export default function SellerDashboard() {
  return (
    <Layout className="min-h-screen bg-gray-50">
    <DashboardHeader />
        <Content className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <Title level={2} className="!mb-1 !text-gray-900">
                Dashboard
              </Title>
              <Text className="text-gray-500">
                Here's an overview on your business
              </Text>
            </div>
            <div className="flex items-center gap-3">
              <Select defaultValue="Last 7 Days" className="w-32">
                <Select.Option value="Last 7 Days">Last 7 Days</Select.Option>
                <Select.Option value="Last 30 Days">Last 30 Days</Select.Option>
              </Select>
              <Button
                type="primary"
                icon={<ExportOutlined />}
                className="bg-cyan-500 border-cyan-500"
              >
                Export
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
