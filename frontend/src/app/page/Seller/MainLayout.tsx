import React, { useState } from 'react';
import { Layout } from 'antd';
import Sidebar from '../../components/seller/Sidebar';
import SellerDashboard from './subpage/SellerDashboard';
import Sale from './subpage/Sale';
import Customer from './subpage/Customer';
import Setting from './subpage/Setting';
import Invoice from './subpage/Invoice';
import Teams from './subpage/Teams';
import StoreInventory from './subpage/StoreInventory';
const { Content, Footer } = Layout;

const pages: Record<string, React.ReactNode> = {
  Dashboard: <SellerDashboard />,
  Sales: <Sale />,
  StoreInventory: <StoreInventory />,
  Customers: <Customer />,
  Invoices: <Invoice />,
  Team: <Teams />,
  Settings: <Setting />,
};

const SellerMainLayout: React.FC = () => {
  const [activePage, setActivePage] = useState('dashboard');
  console.log('current active page: ', activePage);
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar onSelect={(key) => setActivePage(key)} />
      <Layout>
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
