import React, { useState } from 'react';
import { Layout } from 'antd';
import Sidebar from '../../components/seller/Sidebar';
import StoreOwnerDashboard from './tab/StoreOwnerDashboard';
import Sale from './tab/Sale';
import Customer from './tab/Customer';
import Invoice from './tab/Invoice';
import StoreInventory from './tab/StoreInventory';
import Home from '../Home';
import { SellerDashboard } from '../../components/register_seller/SellerDashboard';
import SellerHeader from '../../components/seller/SellerHeader';


const { Content, Footer } = Layout;

const pages: Record<string, React.ReactNode> = {
  Dashboard: <StoreOwnerDashboard />,
  SalesManagement: <Sale />,
  StoreInventory: <StoreInventory />,
  Customers: <Customer />,
  Invoices: <Invoice />,
  Settings: <SellerDashboard />,
  Home: <Home />,
};

const SellerMainLayout: React.FC = () => {
  const [activePage, setActivePage] = useState('Dashboard');
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar onSelect={(key) => setActivePage(key)} />
      <Layout>
        <SellerHeader />
        <Content
          style={{
            margin: '0 16px',
            padding: 24,
            minHeight: 360,
            background: '#F7F7F7',
          }}
        >
          {pages[activePage]}
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Ant Design ©2025 Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  );
};

export default SellerMainLayout;
