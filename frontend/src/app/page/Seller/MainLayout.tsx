import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/seller/Sidebar';
import StoreOwnerDashboard from './tab/StoreOwnerDashboard';
import Sale from './tab/Sale';
import Customer from './tab/Customer';
import Invoice from './tab/Invoice';
import StoreInventory from './tab/StoreInventory';
import Home from '../Home';

import SellerHeader from '../../components/seller/SellerHeader';
import { storeService } from '../../../service/store.service';
import StoreDraftBanner from './StoreDraftBanner';
import StoreInfoTab from './tab/StoreInfoTab';

const { Content, Footer } = Layout;

const pages: Record<string, React.ReactNode> = {
  Dashboard: <StoreOwnerDashboard />,
  SalesManagement: <Sale />,
  StoreInventory: <StoreInventory />,
  Customers: <Customer />,
  Invoices: <Invoice />,
  StoreInfo: <StoreInfoTab />,
  Home: <Home />,
};

const SellerMainLayout: React.FC = () => {
  const [activePage, setActivePage] = useState('Dashboard');
  const [store, setStore] = useState<any>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const checkStore = async () => {
      try {
        const store = await storeService.getMyStore(); // đã là object
        if (!store) {
          navigate('/seller-registration');
          return;
        }
        setStore(store);

      } catch (err) {
        console.error('Error checking store:', err);
        navigate('/seller-registration');
      }
    };

    checkStore();
  }, [navigate]);




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
          <StoreDraftBanner isDraft={store?.is_draft} />
          {!store?.is_draft && pages[activePage]}
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Ant Design ©2025 Created by Ant UED
        </Footer>
      </Layout>
    </Layout>
  );
};

export default SellerMainLayout;
