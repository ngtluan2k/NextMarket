// src/components/admin/AdminSidebar.tsx
import React from "react";
import { Layout, Menu } from "antd";
import {
  UserOutlined,
  AppstoreOutlined,
  DatabaseOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ShopOutlined,
  DollarOutlined,
  GiftOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;

const dotIcon = <span style={{ fontSize: "18px", lineHeight: "0" }}>•</span>;

// Interface props cho component
interface AdminSidebarProps {
  collapsed?: boolean;
  activeKey?: string;
  onMenuClick?: (key: string) => void;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  collapsed = false,
  activeKey = '1-2',
  onMenuClick
}) => {
  const menuItems = [
    {
      key: "1",
      icon: <UserOutlined />,
      label: "Quản lý người dùng & vai trò",
      children: [
        { key: "1-1", icon: dotIcon, label: "Quản lý người dùng" },
        { key: "1-2", icon: dotIcon, label: "Quản lý vai trò" },
        { key: "permissions", icon: dotIcon, label: "Quản lý quyền" },
        { key: "userRoles", icon: dotIcon, label: "Phân quyền người dùng" },
      ],
    },
    {
      key: "2",
      icon: <AppstoreOutlined />,
      label: "Quản lý sản phẩm",
      children: [
        { key: "2-1", icon: dotIcon, label: "Danh sách sản phẩm" },
        { key: "2-2", icon: dotIcon, label: "Danh mục sản phẩm" },
        { key: "2-3", icon: dotIcon, label: "Khuyến mãi sản phẩm" },
      ],
    },
    {
      key: "3",
      icon: <DatabaseOutlined />,
      label: "Quản lý kho",
      children: [
        { key: "3-1", icon: dotIcon, label: "Tồn kho" },
        { key: "3-2", icon: dotIcon, label: "Nhập/Xuất kho" },
      ],
    },
    {
      key: "4",
      icon: <ShoppingCartOutlined />,
      label: "Quản lý đơn hàng",
      children: [
        { key: "4-1", icon: dotIcon, label: "Danh sách đơn hàng" },
        { key: "4-2", icon: dotIcon, label: "Trả hàng/Hoàn tiền" },
      ],
    },
    {
      key: "5",
      icon: <TeamOutlined />,
      label: "Quản lý khách hàng",
      children: [
        { key: "5-1", icon: dotIcon, label: "Danh sách khách hàng" },
        { key: "5-2", icon: dotIcon, label: "Nhóm khách hàng" },
      ],
    },
    {
      key: "6",
      icon: <ShopOutlined />,
      label: "Quản lý thương hiệu",
      children: [
        { key: "6-1", icon: dotIcon, label: "Danh sách thương hiệu" },
        { key: "6-2", icon: dotIcon, label: "Đối soát công nợ" },
      ],
    },
    {
      key: "7",
      icon: <DollarOutlined />,
      label: "Quản lý tài chính",
      children: [
        { key: "7-1", icon: dotIcon, label: "Doanh thu" },
        { key: "7-2", icon: dotIcon, label: "Thanh toán" },
      ],
    },
    {
      key: "8",
      icon: <GiftOutlined />,
      label: "Quản lý marketing",
      children: [
        { key: "8-1", icon: dotIcon, label: "Mã giảm giá" },
        { key: "8-2", icon: dotIcon, label: "Chiến dịch quảng cáo" },
      ],
    },
    {
      key: "9",
      icon: <BarChartOutlined />,
      label: "Báo cáo & thống kê",
    },
    {
      key: "10",
      icon: <ShopOutlined />, // có thể chọn icon khác nếu muốn
      label: "Quản lý cửa hàng",
      children: [
        { key: "10-1", icon: dotIcon, label: "Danh sách cửa hàng" },
        
      ],
    },

  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (onMenuClick) {
      onMenuClick(key);
    }
  };

  return (
    <Sider
      width={287}
      collapsed={collapsed}
      trigger={null}
      style={{
        background: "#fff",
        borderRight: "1px solid #e5e7eb",
        height: "calc(100vh - 80px)", // Trừ đi chiều cao header
        position: "fixed",
        left: 0,
        top: 80, // Bắt đầu từ dưới header
        overflow: "auto",
        zIndex: 30,
        boxShadow: "2px 0 8px rgba(0,0,0,0.06)"
      }}
      breakpoint="lg"
      collapsedWidth={80}
    >

      <Menu
        mode="inline"
        selectedKeys={[activeKey]}
        defaultOpenKeys={collapsed ? [] : ["1"]}
        theme="light"
        items={menuItems}
        onClick={handleMenuClick}
        style={{
          border: 0,
          paddingTop: 8,
        }}
        className="admin-sidebar-menu"
      />

      {/* Custom CSS cho menu */}
      <style>{`
        .admin-sidebar-menu .ant-menu-item,
        .admin-sidebar-menu .ant-menu-submenu-title {
          margin: 0;
          border-radius: 8px;
          margin: 2px 8px;
          padding-left: 16px !important;
        }
        
        .admin-sidebar-menu .ant-menu-item:hover,
        .admin-sidebar-menu .ant-menu-submenu-title:hover {
          background-color: #f3f4f6;
        }
        
        .admin-sidebar-menu .ant-menu-item-selected {
          background-color: #dbeafe;
          color: #1d4ed8;
        }
        
        .admin-sidebar-menu .ant-menu-submenu-open > .ant-menu-submenu-title {
          background-color: #f9fafb;
        }
      `}</style>
    </Sider>
  );
};

export default AdminSidebar;