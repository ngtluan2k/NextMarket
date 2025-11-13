import { Avatar, Button } from 'antd';
import { useLocation } from 'react-router-dom';

interface HeaderProps{
  username: string;
}

const AffiliateHeader = ({username}: HeaderProps) => {
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/affiliate/dashboard':
        return 'Bảng điều khiển';
      case '/affiliate/dashboard/links':
        return 'Liên kết tiếp thị';
      case '/affiliate/dashboard/payments':
        return 'Chuyển đổi';
      case '/affiliate/dashboard/settings':
        return 'Cài đặt';
      case '/affiliate/dashboard/support':
        return 'Hỗ trợ';
      case '/affiliate/dashboard/notification':
        return 'Thông báo';
      default:
        return 'Bảng điều khiển';
    }
  };

  return (
    <div className="space-y-2 w-full flex flex-row justify-between items-center mb-[30px]">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Chào mừng trở lại, {username}
        </h1>
        <p className="text-gray-600">
          Đây là tổng quan về {getPageTitle().toLowerCase()} và doanh thu của
          bạn.
        </p>
      </div>

      <div className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Avatar className="h-6 w-6">IO</Avatar>
          <span>{username}</span>
          <span>/</span>
          <span>{getPageTitle()}</span>
        </div>
      </div>
    </div>
  );
};

export default AffiliateHeader;
