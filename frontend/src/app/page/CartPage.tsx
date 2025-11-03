// frontend/src/app/page/CartPage.tsx
import React, { Suspense, useMemo, useState, useEffect } from 'react';
import EveryMartHeader from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { CartHeader } from '../components/cart/CartHeader';
import { CartRecommendation } from '../components/cart/CartRecommendation';
import { CartSidebar } from '../components/cart/CartSidebar';
import { Row, Col, Typography, Button, Spin, Alert, Card, Tag } from 'antd';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeftOutlined, TeamOutlined, ClockCircleOutlined, CrownOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface CartProps {
  showMessage?: (
    type: 'success' | 'error' | 'warning',
    content: string
  ) => void;
}

interface ActiveGroup {
  id: number;
  name: string;
  status: string;
  expires_at: string | null;
  is_host: boolean;
  store: {
    id: number;
    name: string;
    slug: string;
  };
  host: {
    id: number;
    username: string;
  };
  joined_at: string;
}

const CartPage: React.FC<CartProps> = ({ showMessage }) => {
  const { cart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeGroups, setActiveGroups] = useState<ActiveGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  const allIds = useMemo(() => cart.map((i) => i.id), [cart]);

  const allChecked = selectedIds.length === allIds.length && allIds.length > 0;
  const indeterminate =
    selectedIds.length > 0 && selectedIds.length < allIds.length;

  // Load active groups
  const loadActiveGroups = async () => {
    if (!user?.user_id) return;
    
    setGroupsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/group-orders/user/${user.user_id}/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Active groups loaded:', data); 
        setActiveGroups(data);
      }
    } catch (error) {
      console.error('Failed to fetch active groups:', error);
    } finally {
      setGroupsLoading(false);
    }
  };

  useEffect(() => {
    loadActiveGroups();
  }, [user?.user_id]);

  const handleGoCheckout = () => {
    if (selectedIds.length === 0) return;

    const items = cart
      .filter((i) => selectedIds.includes(i.id))
      .map((i) => ({
        id: i.id,
        type: i.type,
        price: i.price,
        quantity: i.quantity,
        is_group: i.is_group,
        product: {
          id: i.product.id,
          name: i.product.name,
          media: i.product.media,
          store: i.product.store,
          listPrice: i.product.basePrice,
          url:
            (Array.isArray(i.product.media)
              ? i.product.media[0]?.url
              : i.product.media?.url) || i.product.url,
        },
        variant: i.variant,
      }));
    
    const groupItems = items.filter(item => item.is_group);
    const regularItems = items.filter(item => !item.is_group);

    if (groupItems.length > 0 && regularItems.length > 0) {
      // Nếu có cả 2 loại, hiển thị warning
      alert('Không thể thanh toán cùng lúc sản phẩm thường và sản phẩm mua chung. Vui lòng chọn một loại.');
      return;
    }

    console.log('cartPage data: ' + JSON.stringify(items));
    navigate('/checkout', { state: { items, subtotal: selectedTotal } });
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.length === allIds.length ? [] : [...allIds]
    );
  };

  const toggleOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectedTotal = useMemo(
    () =>
      cart
        .filter((i) => selectedIds.includes(i.id))
        .reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart, selectedIds]
  );

  // Component hiển thị thông báo group
  const GroupNotification = () => {
    if (groupsLoading) {
      return (
        <div className="mb-6 flex justify-center">
          <Spin />
        </div>
      );
    }
    
    if (activeGroups.length === 0) return null;

    return (
      <div className="mb-6">
        <Alert
          message="Bạn đang tham gia đơn hàng nhóm"
          description={
            <div className="space-y-3">
              {activeGroups.map((group) => (
                <Card key={group.id} size="small" className="mb-3 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <TeamOutlined className="text-blue-500" />
                        {group.is_host && (
                          <CrownOutlined className="text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Text strong className="text-blue-700">{group.name}</Text>
                          {group.is_host && (
                            <Tag color="gold">
                              <CrownOutlined className="mr-1" />
                              Chủ nhóm
                            </Tag>
                          )}
                        </div>
                        <Text type="secondary" className="text-sm">
                          Cửa hàng: {group.store?.name ?? 'Không xác định'}
                        </Text>
                        <br />
                        <Text type="secondary" className="text-xs">
                          Tham gia lúc: {new Date(group.joined_at).toLocaleString('vi-VN')}
                        </Text>
                      </div>
                    </div>
                    <div className="text-right">
                      {group.expires_at && (
                        <div className="flex items-center gap-1 text-sm text-orange-600 mb-2">
                          <ClockCircleOutlined />
                          <Text type="secondary" className="text-xs">
                            Hết hạn: {new Date(group.expires_at).toLocaleString('vi-VN')}
                          </Text>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          size="small" 
                          type="primary"
                          onClick={() => navigate(`/group-orders/${group.id}/detail`)}
                        >
                          Xem chi tiết
                        </Button>
                        <Button 
                          size="small" 
                          onClick={() => navigate(`/stores/slug/${group.store.slug}?groupId=${group.id}`)}
                        >
                          Mua thêm
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          }
          type="info"
          showIcon
          className="border-blue-200 bg-blue-50"
        />
      </div>
    );
  };

  // Component hiển thị group items trong cart
  const GroupItemsSection = () => {
    const groupItems = cart.filter(item => item.is_group);
    if (groupItems.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TeamOutlined className="text-blue-600" />
            <span className="text-blue-700 font-semibold text-lg">🛒 Đơn hàng nhóm</span>
            <Tag color="blue" className="ml-2">
              {groupItems.length} sản phẩm
            </Tag>
          </div>
          <div className="space-y-2">
            <Text className="text-blue-600 text-sm">
              Các sản phẩm này được thêm vào đơn hàng nhóm và sẽ được xử lý riêng biệt.
            </Text>
            <div className="flex flex-wrap gap-2">
              {groupItems.map(item => (
                <Tag key={item.id} color="blue" className="text-xs">
                  {item.product.name} x{item.quantity}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <EveryMartHeader />

      <main className="mx-auto w-full max-w-[1500px] px-4 lg:px-6 py-6 flex-1">
        {/* Tiêu đề trang */}
        <Title level={3} style={{ marginBottom: 16 }}>
          GIỎ HÀNG
        </Title>
        <Button
          style={{ marginBottom: 16 }}
          icon={<ArrowLeftOutlined />}
          onClick={() => window.history.back()}
        >
          Trở về
        </Button>

        {/* Hiển thị thông báo group */}
        <GroupNotification />

        {cart.length === 0 ? (
          <div>
            <CartHeader
              selectedIds={selectedIds}
              onToggleAll={toggleAll}
              onToggleOne={toggleOne}
              allChecked={allChecked}
              indeterminate={indeterminate}
              showMessage={showMessage}
            />
            <Suspense fallback={<Spin />}>
              <CartRecommendation />
            </Suspense>
          </div>
        ) : (
          <>
            {/* Group Items Section */}
            <GroupItemsSection />

            <Row gutter={16} align="top" wrap={false}>
              <Col flex="1">
                <CartHeader
                  selectedIds={selectedIds}
                  onToggleAll={toggleAll}
                  onToggleOne={toggleOne}
                  allChecked={allChecked}
                  indeterminate={indeterminate}
                  showMessage={showMessage}
                />
                <Suspense fallback={<Spin />}>
                  <CartRecommendation />
                </Suspense>
              </Col>

              <Col flex="300px">
                <CartSidebar
                  mode="cart"
                  selectedCount={selectedIds.length}
                  selectedTotal={selectedTotal}
                  submitLabel={`Mua Hàng (${selectedIds.length})`}
                  onSubmit={handleGoCheckout}
                />
              </Col>
            </Row>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CartPage;