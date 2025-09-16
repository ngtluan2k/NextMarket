// src/components/admin/AdminDashboard.tsx
import React, { useState } from 'react';
import { RoleManager } from './RoleManager';
import { PermissionManager } from './PermissionManager';
import { UserRoleManager } from './UserRoleManager';
import CategoryManager from './CategoryManager';
import InventoryManager from './InventoryManager';
import BrandManager from './BrandManager';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';

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
          <div>
            <h3>Danh sách sản phẩm</h3>
            <p>Chức năng đang phát triển...</p>
          </div>
        );
      case '2-2': // Danh mục sản phẩm
        return <CategoryManager />;
      case '2-3': // Khuyến mãi sản phẩm
        return (
          <div>
            <h3>Khuyến mãi sản phẩm</h3>
            <p>Chức năng đang phát triển...</p>
          </div>
        );
      case '3-1': // Tồn kho
        return <InventoryManager />;
      case '3-2': // Nhập/Xuất kho
        return (
          <div>
            <h3>Nhập/Xuất kho</h3>
            <p>Chức năng đang phát triển...</p>
          </div>
        );
      case '4-1': // Danh sách đơn hàng
        return (
          <div>
            <h3>Danh sách đơn hàng</h3>
            <p>Chức năng đang phát triển...</p>
          </div>
        );
      case '4-2': // Trả hàng/Hoàn tiền
        return (
          <div>
            <h3>Trả hàng/Hoàn tiền</h3>
            <p>Chức năng đang phát triển...</p>
          </div>
        );
      case '5-1': // Danh sách khách hàng
        return (
          <div>
            <h3>Danh sách khách hàng</h3>
            <p>Chức năng đang phát triển...</p>
          </div>
        );
      case '5-2': // Nhóm khách hàng
        return (
          <div>
            <h3>Nhóm khách hàng</h3>
            <p>Chức năng đang phát triển...</p>
          </div>
        );
      case '6-1': // Danh sách nhà bán
        return <BrandManager />;
      case '6-2': // Đối soát công nợ
        return (
          <div>
            <h3>Đối soát công nợ</h3>
            <p>Chức năng đang phát triển...</p>
          </div>
        );
      case '7-1': // Doanh thu
        return (
          <div>
            <h3>Doanh thu</h3>
            <p>Chức năng đang phát triển...</p>
          </div>
        );
      case '7-2': // Thanh toán
        return (
          <div>
            <h3>Thanh toán</h3>
            <p>Chức năng đang phát triển...</p>
          </div>
        );
      case '8-1': // Mã giảm giá
        return (
          <div>
            <h3>Mã giảm giá</h3>
            <p>Chức năng đang phát triển...</p>
          </div>
        );
      case '8-2': // Chiến dịch quảng cáo
        return (
          <div>
            <h3>Chiến dịch quảng cáo</h3>
            <p>Chức năng đang phát triển...</p>
          </div>
        );
      case '9': // Báo cáo & thống kê
        return (
          <div>
            <h3>Báo cáo & thống kê</h3>
            <p>Chức năng đang phát triển...</p>
          </div>
        );
      case 'permissions': // Quản lý quyền (thêm cho phần permissions riêng)
        return <PermissionManager />;
      case 'userRoles': // Phân quyền người dùng (thêm cho phần user roles riêng)
        return <UserRoleManager />;
      default:
        return <RoleManager />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header cố định trên cùng */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <AdminHeader />
      </div>

      <div className="flex">
        {/* Sidebar cố định bên trái */}
        <div className="fixed left-0 top-0 h-screen pt-20 z-40">
          <AdminSidebar activeKey={activeKey} onMenuClick={handleMenuClick} />
        </div>

        {/* Main content area */}
        <div className="flex-1 ml-72 pt-24 px-6 pb-6 overflow-x-hidden overflow-y-auto">
          <div className="bg-white rounded-lg shadow-sm min-h-[calc(100vh-120px)]">
            {/* Content */}
            <div className="p-6">{renderContent()}</div>
          </div>
        </div>
import { StoreManager } from '../register_seller/StoreManager';

export const AdminDashboard: React.FC = () => {
  const [tab, setTab] = useState<'roles' | 'permissions' | 'userRoles' | 'stores'>('stores');

  return (
    <div className="container mt-4">
      <h2>Super Admin Dashboard</h2>
      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button className={`nav-link ${tab === 'stores' ? 'active' : ''}`} onClick={() => setTab('stores')}>Stores</button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${tab === 'roles' ? 'active' : ''}`} onClick={() => setTab('roles')}>Roles</button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'permissions' ? 'active' : ''}`}
            onClick={() => setTab('permissions')}
          >
            Permissions
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'userRoles' ? 'active' : ''}`}
            onClick={() => setTab('userRoles')}
          >
            User-Roles
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'categories' ? 'active' : ''}`}
            onClick={() => setTab('categories')}
          >
            Categories
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'brands' ? 'active' : ''}`}
            onClick={() => setTab('brands')}
          >
            Brands
          </button>
        </li>
      </ul>

      <div className="mt-3">
        {tab === 'stores' && <StoreManager />}
        {tab === 'roles' && <RoleManager />}
        {tab === 'permissions' && <PermissionManager />}
        {tab === 'userRoles' && <UserRoleManager />}
        {tab === 'categories' && <CategoryManager />}
        {tab === 'brands' && <BrandManager />}
>>>>>>> origin/main
      </div>
    </div>
  );
};
