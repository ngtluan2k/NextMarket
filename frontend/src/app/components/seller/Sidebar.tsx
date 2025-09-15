'use client';
import { Layout, Menu, type MenuProps } from 'antd';
import {
  AppstoreAddOutlined,
  MenuUnfoldOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import {
  DashboardOutlined,
  BarChartOutlined,
  UserOutlined,
  FileTextOutlined,
  TeamOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useState } from 'react';

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
  getItem('dashboard', 'Dashboard', <DashboardOutlined />),
  getItem('sales', 'Sales', <BarChartOutlined />),
  getItem('inventory', 'StoreInventory', <AppstoreAddOutlined />),
  getItem('customers', 'Customers', <UserOutlined />),
  getItem('invoices', 'Invoices', <FileTextOutlined />),
  getItem('team', 'Team', <TeamOutlined />),
  getItem('settings', 'Settings', <SettingOutlined />),
];

interface SideBarProps {
  onSelect: (key: string) => void;
}

const Sidebar: React.FC<SideBarProps> = ({ onSelect }) => {
  const [collapsed, setCollapsed] = useState(false);

  const handleDoubleClick = () => {
    setCollapsed(!collapsed);
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
            <span className="text-xl font-bold text-gray-900">
              clothing<span className="font-normal">Store</span>
            </span>
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
        defaultSelectedKeys={['dashboard']}
        items={items}
        onClick={(e) => onSelect(e.key)}
        onDoubleClick={handleDoubleClick}
      />
    </Sider>
  );
};
export default Sidebar;
