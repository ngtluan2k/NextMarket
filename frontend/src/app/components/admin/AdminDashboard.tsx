// src/components/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import { RoleManager } from './RoleManager';
import { PermissionManager } from './PermissionManager';
import { UserRoleManager } from './UserRoleManager';
import CategoryManager from './CategoryManager';
import InventoryManager from './InventoryManager';
import BrandManager from './BrandManager';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import VoucherManager from './VoucherManager';
import StoreManager from './StoreManager';
import AffiliateProgramDashboard from '../../page/affiliate/admin/AffiliateProgramDashboard';
import AffiliateRegistration from '../../page/affiliate/admin/AffiliateRegistrationManager';
import { Empty } from 'antd';
import AffiliateRulesManager from '../../page/affiliate/admin/AffiliateRulesManager';
import CampaignPage from './CampaignPage';
import { Campaign } from '../../../service/campaign.service';
import CampaignDetailPage from './campaigns_components/CampaignDetailPage';
import AdminCampaignStoreProductsWrapper from './AdminCampaignStoreProductsWrapper';
import PublishCampaignForm from './campaigns_components/PublishCampaignForm';
import UpdateCampaignForm from './campaigns_components/UpdateCampaignForm';
import FlashSaleManager, { FlashSale } from './FlashSaleManager';
import FlashSaleStoreProducts from './flash_sale_components/FlashSaleStoreProducts';
import {
  checkIsAdmin,
  AdminCheckResult,
} from '../../../service/user-helper.service';
import { useNavigate } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string>('1-2');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [selectedFlashSale, setSelectedFlashSale] = useState<FlashSale | null>(
    null
  );
  const [loading, setLoading] = useState(true); // loading khi check admin
  const navigate = useNavigate(); // để redirect

  const handleSelectStore = (storeId: number) => {
    setSelectedStoreId(storeId);
    setActiveKey('8-2-store'); // chuyển sang tab xem sản phẩm store
  };

  const Wip: React.FC<{ title?: string; desc?: string; img?: string }> = ({
    title = 'Chức năng đang phát triển...',
    desc = 'Tính năng sẽ sớm ra mắt.',
    img = 'img/img/Gemini_Generated_Image_wcu7v2wcu7v2wcu7.png',
  }) => (
    <div className="flex flex-col items-center justify-center py-16">
      <img
        src={img}
        alt="Work in progress"
        className="w-[380px] max-w-full"
        style={{ filter: 'brightness(1.15) contrast(1.05)' }} // tạm thời
      />
      <h3 className="mt-4 text-lg font-semibold text-gray-900 text-center">
        {title}
      </h3>
      <p className="mt-1 text-sm text-gray-500 text-center">{desc}</p>
    </div>
  );

  const handleMenuClick = (key: string) => {
    setActiveKey(key);
  };

  const renderContent = () => {
    switch (activeKey) {
      case '1-1':
        return <Wip title="Quản lý người dùng" />;

      case '1-2':
        return <RoleManager />;

      case '2-1':
        return <Wip title="Danh sách sản phẩm" />;

      case '2-2':
        return <CategoryManager />;

      case '2-3':
        return <Wip title="Khuyến mãi sản phẩm" />;

      case '3-1':
        return <InventoryManager />;

      case '3-2':
        return <Wip title="Nhập/Xuất kho" />;

      case '4-1':
        return <Wip title="Danh sách đơn hàng" />;

      case '4-2':
        return <Wip title="Trả hàng / Hoàn tiền" />;

      case '5-1':
        return <Wip title="Danh sách khách hàng" />;

      case '5-2':
        return <Wip title="Nhóm khách hàng" />;

      case '6-1':
        return <BrandManager />;
      case '6-2': // Đối soát công nợ
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>Chức năng đang phát triển...</span>}
          />
        );
      case '7-1': // Doanh thu
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>Chức năng đang phát triển...</span>}
          />
        );
      case '7-2': // Thanh toán
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>Chức năng đang phát triển...</span>}
          />
        );
      case '8-1':
        return <VoucherManager />;

      case '8-2':
        return (
          <CampaignPage
            onSelectCampaign={(c, mode) => {
              setSelectedCampaign(c);
              if (mode === 'detail') setActiveKey('8-2-detail');
              else if (mode === 'publish') setActiveKey('8-2-publish');
              else if (mode === 'update') setActiveKey('8-2-update');
            }}
          />
        );
      case '8-2-detail':
        return (
          <CampaignDetailPage
            campaign={selectedCampaign}
            onBack={() => setActiveKey('8-2')}
            onSelectStore={(storeId) => {
              setSelectedStoreId(storeId); // lưu storeId
              setActiveKey('8-2-store'); // chuyển sang trang store products
            }}
          />
        );

      case '8-2-store':
        return selectedCampaign && selectedStoreId ? (
          <AdminCampaignStoreProductsWrapper
            campaignId={selectedCampaign.id}
            storeId={selectedStoreId}
            onBack={() => setActiveKey('8-2-detail')}
          />
        ) : null;

      case '8-2-publish':
        return selectedCampaign ? (
          <PublishCampaignForm
            campaignId={selectedCampaign.id}
            onClose={() => setActiveKey('8-2')}
          />
        ) : null;

      case '8-2-update':
        return selectedCampaign ? (
          <UpdateCampaignForm
            campaignId={selectedCampaign.id}
            onClose={() => setActiveKey('8-2')}
          />
        ) : null;

      case '8-3':
        return (
          <FlashSaleManager
            onSelectFlashSale={(fs) => {
              setSelectedFlashSale(fs); // lưu flash sale đã chọn
              setActiveKey('8-3-store'); // chuyển view sang store products
            }}
          />
        );
      case '8-3-store':
        return selectedFlashSale ? (
          <FlashSaleStoreProducts
            scheduleId={selectedFlashSale.id}
            scheduleStartsAt={selectedFlashSale.starts_at}
            scheduleEndsAt={selectedFlashSale.ends_at}
            storeId={selectedStoreId || undefined} // nếu null thì bỏ qua filter
            onBack={() => setActiveKey('8-3')}
          />
        ) : null;

      case '9':
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>Chức năng đang phát triển...</span>}
          />
        );
      case '10-1':
        return <StoreManager />;

      case '10-2':
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>Chức năng đang phát triển...</span>}
          />
        );
      case '11-1':
        return <AffiliateRegistration />;
      case '11-2':
        return <AffiliateProgramDashboard />;
      case '11-3':
        return <AffiliateRulesManager />;
      case 'permissions':
        return <PermissionManager />;
      case 'userRoles':
        return <UserRoleManager />;

      default:
        return <RoleManager />;
    }
  };

  // Check quyền admin khi load component
  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        setLoading(true);
        const adminData: AdminCheckResult = await checkIsAdmin();
        console.log('✅ User is admin:', adminData);
        setLoading(false);
      } catch (error) {
        console.error('❌ User is not admin:', error);
        // redirect sang trang không có quyền
        navigate('/404');
      }
    };

    verifyAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500 text-lg">Đang kiểm tra quyền admin...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="fixed top-0 left-0 right-0 z-50">
        <AdminHeader />
      </div>

      <div className="flex">
        <div className="fixed left-0 top-0 h-screen pt-20 z-40">
          <AdminSidebar activeKey={activeKey} onMenuClick={handleMenuClick} />
        </div>

        <div className="flex-1 ml-72 pt-24 px-6 pb-6 overflow-x-hidden overflow-y-auto">
          <div className="bg-white rounded-lg shadow-sm min-h-[calc(100vh-120px)]">
            <div className="p-6">{renderContent()}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
