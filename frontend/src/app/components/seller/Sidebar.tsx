'use client';
import { Layout, Menu, type MenuProps } from 'antd';
import {
  AppstoreAddOutlined,
  HomeOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import {
  DashboardOutlined,
  BarChartOutlined,
  UserOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
const { Sider } = Layout;

type MenuItem = Required<MenuProps>['items'][number];

function getItem(
  label: string,
  key: string,
  icon?: React.ReactNode,
  children?: MenuItem[]
): MenuItem {
  return { key, icon, children, label } as MenuItem;
}

const items: MenuItem[] = [
  getItem('Trang chủ', 'Dashboard', <DashboardOutlined />),
  getItem('Quản lý bán hàng', 'SalesManagement', <BarChartOutlined />),
  getItem('Quản lí kho hàng', 'StoreInventory', <AppstoreAddOutlined />),
  getItem('Đơn mua hàng', 'Customers', <UserOutlined />),
  getItem('Hóa Đơn ', 'Invoices', <FileTextOutlined />),
  getItem('Trở về trang chủ', 'HomePage', <HomeOutlined />),
];

interface SideBarProps {
  onSelect: (key: string) => void;
}

const Sidebar: React.FC<SideBarProps> = ({ onSelect }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleDoubleClick = () => {
    setCollapsed(!collapsed);
  };

  const handleMenuClick = (e: { key: string }) => {
    if (e.key === 'HomePage') {
      navigate('/');
    } else {
      onSelect(e.key);
    }
  };

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={240}
      className="bg-white shadow-sm"
    >
      <div className="p-3 flex flex-col item-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
            <ShoppingCartOutlined className="text-white text-lg" />
          </div>
          <div
            className={`transition-all duration-300 ease-in-out ${
              collapsed ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
            style={{ display: collapsed ? 'none' : 'block' }}
          >
            <span className="text-xl font-bold text-gray-900">Everymart</span>
          </div>
        </div>
        <nav className="space-y-1">
          <div
            className="custom-sidebar__header"
            style={{ textAlign: 'center', margin: '16px 0' }}
          >
            <button
              className="custom-sidebar__trigger"
              onClick={() => setCollapsed(!collapsed)}
            >
              <MenuUnfoldOutlined />
            </button>
          </div>
        </nav>
      </div>
      <Menu
        theme="light"
        mode="inline"
        defaultSelectedKeys={['Dashboard']}
        items={items}
        onClick={(e) => handleMenuClick(e)}
        onDoubleClick={handleDoubleClick}
      />
    </Sider>
  );
};
export default Sidebar;
