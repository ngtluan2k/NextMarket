import React from 'react';
import { Card, Avatar, Descriptions, Tag, Statistic, Row, Col, Divider } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import { User } from '../../../service/user-helper.service';
import dayjs from 'dayjs';

interface CommissionInfo {
  totalEarned: number;
  totalPending: number;
  totalPaid: number;
  currentLevel: number;
  ratePercent: number;
}

interface UserInfoCardProps {
  user: User | null;
  commissionInfo?: CommissionInfo | null;
  loading?: boolean;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ user, commissionInfo, loading = false }) => {
  console.log('UserInfoCard rendering:', { user, commissionInfo, loading });
  
  if (loading) {
    return (
      <Card 
        title="Thông tin User" 
        loading={true}
        style={{ height: 'fit-content' }}
      >
        <div className="text-center text-gray-500 py-8">
          <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
          <p className="mt-2">Đang tải thông tin user...</p>
        </div>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card 
        title="Thông tin User" 
        loading={false}
        style={{ height: 'fit-content' }}
      >
        <div className="text-center text-gray-500 py-8">
          <UserOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
          <p className="mt-2">Không tìm thấy thông tin user</p>
        </div>
      </Card>
    );
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND'
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '—';
    return dayjs(dateString).format('DD/MM/YYYY HH:mm');
  };

  return (
    <Card 
      title="Thông tin User" 
      loading={loading}
      style={{ height: 'fit-content' }}
    >
      <div className="space-y-4">
        {/* Debug info - sẽ xóa sau khi fix */}
        <div className="bg-yellow-100 p-2 text-xs">
          DEBUG: User ID: {user.id}, Name: {user.full_name}, Email: {user.user?.email}
        </div>
        
        {/* Avatar và thông tin cơ bản */}
        <div className="text-center">
          <Avatar 
            size={80} 
            src={user.avatar_url || undefined} 
            icon={<UserOutlined />}
            className="mb-3"
          />
          <h3 className="text-lg font-semibold mb-1">
            {user.full_name || 'Không có tên'}
          </h3>
          <p className="text-sm text-gray-600 mb-2">
            @{user.user?.username || 'Không có username'}
          </p>
          <Tag color={user.user?.is_affiliate ? 'green' : 'default'}>
            {user.user?.is_affiliate ? 'Affiliate' : 'Thường'}
          </Tag>
        </div>

        <Divider />

        {/* Thông tin chi tiết */}
        <Descriptions column={1} size="small">
          <Descriptions.Item 
            label={<><MailOutlined className="mr-1" />Email</>}
          >
            {user.user?.email || '—'}
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={<><PhoneOutlined className="mr-1" />Số điện thoại</>}
          >
            {user.phone || '—'}
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={<><CalendarOutlined className="mr-1" />Ngày sinh</>}
          >
            {formatDate(user.dob)}
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={<><UserOutlined className="mr-1" />Giới tính</>}
          >
            {user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : (user.gender || '—')}
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={<><UserOutlined className="mr-1" />Quốc gia</>}
          >
            {user.country || '—'}
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={<><CalendarOutlined className="mr-1" />Ngày tạo</>}
          >
            {formatDate(user.created_at)}
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={<><CalendarOutlined className="mr-1" />Cập nhật cuối</>}
          >
            {formatDate(user.user?.updated_at ?? undefined)}
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={<><UserOutlined className="mr-1" />Trạng thái</>}
          >
            <Tag color={user.user?.status === 'active' ? 'green' : 'red'}>
              {user.user?.status === 'active' ? 'Hoạt động' : (user.user?.status || '—')}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        {/* Thông tin Commission */}
        {commissionInfo && (
          <>
            <Divider />
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <DollarOutlined className="mr-2" />
                Thông tin Affiliate
              </h4>
              
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Cấp độ"
                    value={commissionInfo.currentLevel}
                    suffix="Level"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Tỷ lệ %"
                    value={commissionInfo.ratePercent}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
              </Row>

              <Row gutter={[16, 16]} className="mt-3">
                <Col span={24}>
                  <Statistic
                    title="Đã kiếm được"
                    value={commissionInfo.totalEarned}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Đang chờ"
                    value={commissionInfo.totalPending}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Đã thanh toán"
                    value={commissionInfo.totalPaid}
                    formatter={(value) => formatCurrency(Number(value))}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default UserInfoCard;
