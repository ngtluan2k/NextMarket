// src/components/admin/AdminHeader.tsx
import { useState } from 'react';
import { Input, Badge, Avatar, Dropdown, Menu } from 'antd';
import { BellOutlined, UserOutlined } from '@ant-design/icons';

const { Search } = Input;

const AdminHeader = () => {
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    console.log('Đăng xuất');
    // Thêm logic logout ở đây, ví dụ: xóa token, redirect...
  };

  const menu = (
    <Menu>
      <Menu.Item key="logout" onClick={handleLogout}>
        Đăng xuất
      </Menu.Item>
    </Menu>
  );

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-20">
      <div className="flex items-center justify-between h-full px-6">
        {/* Logo và tên */}
        <div className="flex items-center space-x-3">
          <img
            src="/logo.jpg"
            alt="Logo"
            className="h-16 w-24 object-cover rounded-lg"
          />
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-gray-900">Admin </h1>
            <p className="text-sm text-gray-500">Quản trị hệ thống</p>
          </div>
        </div>

        {/* Thanh tìm kiếm */}
        <div className="flex-1 max-w-lg mx-6">
          <Search
            placeholder="Tìm kiếm trong hệ thống..."
            allowClear
            size="large"
            className="w-full"
          />
        </div>

        {/* Thông báo và avatar */}
        <div className="flex items-center space-x-4">
          {/* Chuông thông báo */}
          <Badge count={5} size="small">
            <BellOutlined
              style={{
                fontSize: 20,
                cursor: 'pointer',
                color: '#6b7280',
              }}
            />
          </Badge>

          {/* Avatar và menu */}
          <Dropdown overlay={menu} trigger={['click']} placement="bottomRight">
            <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg">
              <Avatar size="large" src="/avatar.png" icon={<UserOutlined />} />
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">Admin User</p>
                <p className="text-xs text-gray-500">Quản trị viên</p>
              </div>
            </div>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
