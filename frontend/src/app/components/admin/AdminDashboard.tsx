// src/components/admin/AdminDashboard.tsx
import React, { useState } from 'react';
import { Empty } from 'antd';
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
import AffiliateProgramDashboard from './AffiliateProgramDashboard';
import AffiliateRegistration from './AffiliateRegistrationManager'

export const AdminDashboard: React.FC = () => {
  const [activeKey, setActiveKey] = useState<string>('1-2');

  const handleMenuClick = (key: string) => {
    setActiveKey(key);
  };

  const renderContent = () => {
    switch (activeKey) {
      case '1-1': // Quản lý người dùng
        return (
          <div>
            <h3>Quản lý người dùng</h3>
            <p>Chức năng đang phát triển...</p>
          </div>
        );
      case '1-2': // Quản lý vai trò
        return <RoleManager />;
      case '2-1': // Danh sách sản phẩm
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>Chức năng đang phát triển...</span>}
          />
        );
      case '2-2': // Danh mục sản phẩm
        return <CategoryManager />;
      case '2-3': // Khuyến mãi sản phẩm
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>Chức năng đang phát triển...</span>}
          />
        );
      case '3-1': // Tồn kho
        return <InventoryManager />;
      case '3-2': // Nhập/Xuất kho
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>Chức năng đang phát triển...</span>}
          />
        );
      case '4-1': // Danh sách đơn hàng
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>Chức năng đang phát triển...</span>}
          />
        );
      case '4-2': // Trả hàng/Hoàn tiền
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>Chức năng đang phát triển...</span>}
          />
        );
      case '5-1': // Danh sách khách hàng
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>Chức năng đang phát triển...</span>}
          />
        );
      case '5-2': // Nhóm khách hàng
        return (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>Chức năng đang phát triển...</span>}
          />
        );
      case '6-1': // Danh sách nhà bán
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
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<span>Chức năng đang phát triển...</span>}
          />
        );
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
      case 'permissions':
        return <PermissionManager />;
      case 'userRoles': 
        return <UserRoleManager />;
      default:
        return <RoleManager />;
    }
  };

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
