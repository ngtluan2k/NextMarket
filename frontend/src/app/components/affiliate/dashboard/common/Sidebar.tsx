import { Button } from 'antd';
import React from 'react';
import {
  Home,
  Link2,
  CreditCard,
  BookOpen,
  Settings,
  HelpCircle,
  Bell,
  X,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const location = useLocation();

  const navigation = [
    {
      name: 'Tổng quan bảng điều khiển',
      href: '/affiliate/dashboard',
      icon: Home,
    },
    {
      name: 'Liên kết tiếp thị',
      href: '/affiliate/dashboard/links',
      icon: Link2,
    },
    {
      name: 'Thanh toán',
      href: '/affiliate/dashboard/payments',
      icon: CreditCard,
    },
    {
      name: 'Tài nguyên',
      href: '/affiliate/dashboard/resource',
      icon: BookOpen,
    },
  ];

  const bottomNavigation = [
    { name: 'Cài đặt', href: '/affiliate/dashboard/setting', icon: Settings },
    {
      name: 'Hỗ trợ',
      href: '/affiliate/dashboard/support',
      icon: HelpCircle,
      badge: 'Trực tuyến',
    },
    {
      name: 'Thông báo',
      href: '/affiliate/dashboard/notifications',
      icon: Bell,
    },
  ];

  return (
    <aside
      className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 
        transform transition-transform duration-300 ease-in-out translate-x-full lg:translate-x-0 `}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Everymart</span>
          </NavLink>
        </div>

        <div className="px-4 py-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm"
              className="w-full px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs text-gray-500 bg-white border border-gray-200 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group ${
                  isActive ? 'bg-gray-100 text-blue-500' : ''
                }`
              }
            >
              <item.icon
                className={`h-5 w-5 ${
                  location.pathname === item.href
                    ? 'text-blue-500'
                    : 'text-gray-500 group-hover:text-blue-500'
                }`}
              />
              <span className="text-sm font-medium">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-200 space-y-1">
          {bottomNavigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors group relative ${
                  isActive ? 'bg-gray-100 text-blue-500' : ''
                }`
              }
            >
              <item.icon
                className={`h-5 w-5 ${
                  location.pathname === item.href
                    ? 'text-blue-500'
                    : 'text-gray-500 group-hover:text-blue-500'
                }`}
              />
              <span className="text-sm font-medium">{item.name}</span>
              {item.badge && (
                <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </div>

        <div className="mx-3 mb-4 p-4 bg-gray-100 rounded-lg">
          <button className="w-full text-left group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">
                Mời bạn bè
              </span>
              <X className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Nhận lại 50% trong 12 tháng khi có người sử dụng liên kết của bạn.
            </p>
            <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
              <code className="flex-1 text-xs text-gray-900 truncate">
                uui.com/40B0020
              </code>
              <Button
                size="small"
                className="h-6 px-2 text-xs hover:bg-gray-100"
              >
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </Button>
            </div>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
