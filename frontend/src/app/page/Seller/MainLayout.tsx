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
import StoreOwnerVoucherManager from '../../components/seller/StoreOwnerVoucherManager';
import StoreCampaignManager from './tab/StoreCampaignManager';
import StoreCampaignDetail from './tab/StoreCampaignDetail';
import FlashSaleManager from './tab/FlashSaleManager';
import FlashSaleRegister from './tab/FlashSaleRegister';
import { Modal } from 'antd';

const { Content, Footer } = Layout;

const SellerMainLayout: React.FC = () => {
  const [activePage, setActivePage] = useState<
    | 'Dashboard'
    | 'SalesManagement'
    | 'StoreInventory'
    | 'Customers'
    | 'Invoices'
    | 'StoreInfo'
    | 'VoucherManagement'
    | 'StoreCampaignManager'
    | 'StoreCampaignDetail'
    | 'FlashSaleManager'
    | 'FlashSaleRegister'
    | 'Home'
  >('Dashboard');
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>();
  const [store, setStore] = useState<any>(null);
  const navigate = useNavigate();
  const [selectedFlashSaleId, setSelectedFlashSaleId] = useState<number | null>(
    null
  );
  const [isChatModalVisible, setIsChatModalVisible] = useState(false);
  const openChatModal = () => setIsChatModalVisible(true);
  const closeChatModal = () => setIsChatModalVisible(false);

  useEffect(() => {
    const checkStore = async () => {
      try {
        const store = await storeService.getMyStore();
        if (!store) {
          navigate('/seller-registration');
          return;
        }
        setStore(store);
      } catch (err) {
        console.error(err);
        navigate('/seller-registration');
      }
    };
    checkStore();
  }, [navigate]);

  const renderPage = () => {
    if (!store) return null;
    if (store.is_draft) return null;

    switch (activePage) {
      case 'Dashboard':
        return <StoreOwnerDashboard />;
      case 'SalesManagement':
        return <Sale />;
      case 'StoreInventory':
        return <StoreInventory />;
      case 'Customers':
        return <Customer />;
      case 'Invoices':
        return <Invoice />;
      case 'StoreInfo':
        return <StoreInfoTab />;
      case 'VoucherManagement':
        return <StoreOwnerVoucherManager />;
      case 'StoreCampaignManager':
        return (
          <StoreCampaignManager
            onSelectCampaign={(id: number) => {
              setSelectedCampaignId(id);
              setActivePage('StoreCampaignDetail');
            }}
          />
        );
      case 'StoreCampaignDetail':
        if (!selectedCampaignId) return null;
        return (
          <StoreCampaignDetail
            campaignId={selectedCampaignId}
            onBack={() => setActivePage('StoreCampaignManager')}
          />
        );
      case 'FlashSaleManager':
        return (
          <FlashSaleManager
            onSelectFlashSale={(id: number) => {
              setSelectedFlashSaleId(id);
              setActivePage('FlashSaleRegister');
            }}
          />
        );

      case 'FlashSaleRegister':
        if (!selectedFlashSaleId) return null;
        return (
          <FlashSaleRegister
            scheduleId={selectedFlashSaleId}
            storeId={store.id}
            onBack={() => setActivePage('FlashSaleManager')}
          />
        );

      case 'Home':
        return <Home />;
      default:
        return <StoreOwnerDashboard />;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar
        onSelect={(key) =>
          setActivePage(
            key as
              | 'Dashboard'
              | 'SalesManagement'
              | 'StoreInventory'
              | 'Customers'
              | 'Invoices'
              | 'StoreInfo'
              | 'VoucherManagement'
              | 'StoreCampaignManager'
              | 'StoreCampaignDetail'
              | 'FlashSaleManager'
              | 'FlashSaleRegister'
              | 'Home'
          )
        }
      />
      <Layout>
        <SellerHeader />{' '}
        <Content
          style={{
            margin: '0 16px',
            padding: 24,
            minHeight: 360,
            background: '#F7F7F7',
          }}
        >
          <StoreDraftBanner isDraft={store?.is_draft} />
          {renderPage()}
        </Content>
        <Footer style={{ textAlign: 'center' }}></Footer>
      </Layout>
      
    </Layout>
  );
};

export default SellerMainLayout;
