import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Tabs,
  Tag,
  Button,
  Empty,
  Spin,
  message,
  Modal,
  Input,
  Row,
  Col,
  Badge,
  Pagination,
} from 'antd';
import {
  GiftOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CopyOutlined,
  GlobalOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { userVoucherApi } from '../../api/voucher.api';
import { useAuth } from '../../context/AuthContext';
import { 
  Voucher, 
  VoucherStatus, 
  VoucherType,
  formatDiscountValue, 
  getVoucherTypeLabel, 
  isVoucherActive, 
  isVoucherExpired 
} from '../../types/voucher';

const { TabPane } = Tabs;
const { Search } = Input;

const AccountVoucher: React.FC = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { me } = useAuth();

  useEffect(() => {
    fetchUserVouchers();
  }, [me]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const fetchUserVouchers = async () => {
    if (!me?.id) {
      message.error('Vui lòng đăng nhập để xem voucher');
      return;
    }
    
    setLoading(true);
    try {
      const response = await userVoucherApi.getMyVouchers();
      setVouchers(response);
      console.log('📦 Loaded user platform vouchers:', response.length);
    } catch (error: any) {
      console.error('Error fetching vouchers:', error);
      message.error('Không thể tải danh sách voucher');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredVouchers = () => {
    let filtered = vouchers;

    // Lọc theo tab
    switch (activeTab) {
      case 'available':
        filtered = filtered.filter(voucher => isVoucherActive(voucher) && (voucher.user_used_count || 0) < voucher.per_user_limit);
        break;
      case 'used':
        filtered = filtered.filter(voucher => (voucher.user_used_count || 0) > 0 && !(isVoucherActive(voucher) && (voucher.user_used_count || 0) < voucher.per_user_limit));
        break;
      case 'expired':
        filtered = filtered.filter(voucher => isVoucherExpired(voucher) && (voucher.user_used_count || 0) === 0);
        break;
      default:
        break;
    }

    // Lọc theo search text
    if (searchText) {
      filtered = filtered.filter(voucher =>
        voucher.code.toLowerCase().includes(searchText.toLowerCase()) ||
        voucher.title.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    return filtered;
  };

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    message.success(`Đã sao chép mã: ${code}`);
  };

  const getVoucherStatusTag = (voucher: Voucher) => {
    const userUsed = voucher.user_used_count || 0;
    if (isVoucherExpired(voucher)) {
      return <Tag color="red" icon={<CloseCircleOutlined />}>Hết hạn</Tag>;
    }
    if (!isVoucherActive(voucher) || userUsed >= voucher.per_user_limit) {
      return <Tag color="orange" icon={<ClockCircleOutlined />}>Không khả dụng</Tag>;
    }
    if (userUsed > 0) {
      return <Tag color="blue" icon={<CheckCircleOutlined />}>Đã sử dụng {userUsed}/{voucher.per_user_limit}</Tag>;
    }
    return <Tag color="green" icon={<CheckCircleOutlined />}>Có thể sử dụng</Tag>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const isAlmostExpired = (voucher: Voucher) => {
    const endDate = new Date(voucher.end_date);
    const now = new Date();
    const daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 3 && daysLeft > 0;
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <GiftOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
            <span>Kho Voucher Của Tôi</span>
            <Tag color="blue" icon={<GlobalOutlined />}>
              Voucher Sàn
            </Tag>
          </div>
        }
        extra={
          <Search
            placeholder="Tìm kiếm voucher..."
            allowClear
            style={{ width: 300 }}
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <Badge count={vouchers.filter(v => isVoucherActive(v) && (v.user_used_count || 0) < v.per_user_limit).length} offset={[10, 0]}>
                <span>
                  <CheckCircleOutlined />
                  Có thể sử dụng
                </span>
              </Badge>
            }
            key="available"
          >
            <VoucherList
              vouchers={getFilteredVouchers()}
              loading={loading}
              onCopyCode={copyVoucherCode}
              getStatusTag={getVoucherStatusTag}
              formatDate={formatDate}
              isAlmostExpired={isAlmostExpired}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          </TabPane>

          <TabPane
            tab={
              <Badge count={vouchers.filter(v => (v.user_used_count || 0) > 0 && !(isVoucherActive(v) && (v.user_used_count || 0) < v.per_user_limit)).length} offset={[10, 0]}>
                <span>
                  <CheckCircleOutlined />
                  Đã sử dụng
                </span>
              </Badge>
            }
            key="used"
          >
            <VoucherList
              vouchers={getFilteredVouchers()}
              loading={loading}
              onCopyCode={copyVoucherCode}
              getStatusTag={getVoucherStatusTag}
              formatDate={formatDate}
              isAlmostExpired={isAlmostExpired}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          </TabPane>

          <TabPane
            tab={
              <Badge count={vouchers.filter(v => isVoucherExpired(v) && (v.user_used_count || 0) === 0).length} offset={[10, 0]}>
                <span>
                  <ClockCircleOutlined />
                  Hết hạn
                </span>
              </Badge>
            }
            key="expired"
          >
            <VoucherList
              vouchers={getFilteredVouchers()}
              loading={loading}
              onCopyCode={copyVoucherCode}
              getStatusTag={getVoucherStatusTag}
              formatDate={formatDate}
              isAlmostExpired={isAlmostExpired}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

// Component VoucherCard với thiết kế giống hệ thống lớn
const VoucherCard: React.FC<{
  voucher: Voucher;
  onCopyCode: (code: string) => void;
  getStatusTag: (voucher: Voucher) => React.ReactNode;
  formatDate: (dateString: string) => string;
  isAlmostExpired: (voucher: Voucher) => boolean;
}> = ({ voucher, onCopyCode, getStatusTag, formatDate, isAlmostExpired }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Badge.Ribbon 
      text="Voucher Sàn" 
      color="blue"
      style={{ display: voucher.store_id ? 'none' : 'block' }}
    >
      <Card
        style={{
          width: '100%',
          border: `2px dashed ${voucher.theme_color || '#ff4d4f'}`,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${voucher.theme_color || '#ff4d4f'}15, #ffffff)`,
          marginBottom: 16,
        }}
        bodyStyle={{ padding: '16px' }}
      >
        <Row gutter={16} align="middle">
          <Col span={18}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 8,
                  background: voucher.theme_color || '#ff4d4f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 24,
                  flexShrink: 0,
                }}
              >
                <GlobalOutlined />
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <h3 style={{ margin: 0, color: '#1890ff', fontSize: '16px' }}>{voucher.title}</h3>
                  {getStatusTag(voucher)}
                  {isAlmostExpired(voucher) && (
                    <Tag color="red" icon={<FireOutlined />}>Sắp hết hạn</Tag>
                  )}
                </div>

                <div style={{ marginBottom: 8 }}>
                  <strong>Mã: </strong>
                  <span style={{ 
                    fontFamily: 'monospace', 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    color: '#ff4d4f',
                    background: '#fff2f0',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>
                    {voucher.code}
                  </span>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <strong>Giảm: </strong>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff4d4f' }}>
                    {formatDiscountValue(voucher.discount_value, voucher.discount_type)}
                  </span>
                  {voucher.max_discount_amount && (
                    <span style={{ color: '#666', fontSize: '12px', marginLeft: 8 }}>
                      (Tối đa {voucher.max_discount_amount.toLocaleString()}đ)
                    </span>
                  )}
                </div>

                <div style={{ color: '#666', fontSize: '12px' }}>
                  <div>
                    <ClockCircleOutlined /> HSD: {formatDate(voucher.end_date)}
                    {isAlmostExpired(voucher) && ' ⚠️'}
                  </div>
                  {voucher.min_order_amount > 0 && (
                    <div>Đơn tối thiểu: {voucher.min_order_amount.toLocaleString()}đ</div>
                  )}
                </div>
              </div>
            </div>
          </Col>

          <Col span={6} style={{ textAlign: 'right' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Button 
                type="link" 
                onClick={() => setShowDetails(true)}
                size="small"
              >
                Chi tiết
              </Button>
              {isVoucherActive(voucher) && (voucher.user_used_count || 0) < voucher.per_user_limit && (
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => onCopyCode(voucher.code)}
                  icon={<CopyOutlined />}
                >
                  Sao chép
                </Button>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Modal chi tiết */}
      <Modal
        title="Chi tiết Voucher"
        open={showDetails}
        onCancel={() => setShowDetails(false)}
        footer={[
          <Button key="copy" type="primary" onClick={() => onCopyCode(voucher.code)}>
            <CopyOutlined /> Sao chép mã
          </Button>,
          <Button key="close" onClick={() => setShowDetails(false)}>
            Đóng
          </Button>,
        ]}
      >
        <div style={{ lineHeight: '2' }}>
          <div><strong>Tên voucher:</strong> {voucher.title}</div>
          <div><strong>Mã:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{voucher.code}</span></div>
          <div><strong>Loại:</strong> <Tag color="blue">Voucher Sàn</Tag></div>
          <div>
            <strong>Giảm giá:</strong> 
            <span style={{ color: '#ff4d4f', fontWeight: 'bold', marginLeft: 8 }}>
              {formatDiscountValue(voucher.discount_value, voucher.discount_type)}
            </span>
            {voucher.max_discount_amount && ` (Tối đa ${voucher.max_discount_amount.toLocaleString()}đ)`}
          </div>
          <div><strong>Đơn tối thiểu:</strong> {voucher.min_order_amount.toLocaleString()}đ</div>
          <div><strong>Ngày bắt đầu:</strong> {formatDate(voucher.start_date)}</div>
          <div><strong>Ngày kết thúc:</strong> {formatDate(voucher.end_date)}</div>
          <div><strong>Giới hạn sử dụng:</strong> {voucher.per_user_limit} lần/người</div>
          <div><strong>Đã sử dụng:</strong> {voucher.user_used_count || 0} lần</div>
          {voucher.description && (
            <div><strong>Mô tả:</strong> {voucher.description}</div>
          )}
          <div><strong>Trạng thái:</strong> {getStatusTag(voucher)}</div>
        </div>
      </Modal>
    </Badge.Ribbon>
  );
};

// Component VoucherList
const VoucherList: React.FC<{
  vouchers: Voucher[];
  loading: boolean;
  onCopyCode: (code: string) => void;
  getStatusTag: (voucher: Voucher) => React.ReactNode;
  formatDate: (dateString: string) => string;
  isAlmostExpired: (voucher: Voucher) => boolean;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}> = ({ vouchers, loading, onCopyCode, getStatusTag, formatDate, isAlmostExpired, currentPage, setCurrentPage }) => {
  const pageSize = 10;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (vouchers.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Không có voucher nào"
        style={{ padding: '50px 0' }}
      />
    );
  }

  const slicedVouchers = vouchers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div>
      {slicedVouchers.map((voucher) => (
        <VoucherCard
          key={voucher.id}
          voucher={voucher}
          onCopyCode={onCopyCode}
          getStatusTag={getStatusTag}
          formatDate={formatDate}
          isAlmostExpired={isAlmostExpired}
        />
      ))}
      <Pagination
        style={{ textAlign: 'center', marginTop: 16 }}
        current={currentPage}
        pageSize={pageSize}
        total={vouchers.length}
        onChange={setCurrentPage}
      />
    </div>
  );
};

export default AccountVoucher;