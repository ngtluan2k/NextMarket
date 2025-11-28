// frontend/src/app/page/CartPage.tsx
'use client';

import React, { Suspense, useMemo, useState, useEffect } from 'react';
import EveryMartHeader from '../components/Navbar';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';
import { CartHeader } from '../components/cart/CartHeader';
import { CartRecommendation } from '../components/cart/CartRecommendation';
import { CartSidebar } from '../components/cart/CartSidebar';
import {
  Row,
  Col,
  Typography,
  Button,
  Spin,
  Alert,
  Card,
  Tag,
  Collapse,
  Space,
  Input,
  Select,
  Segmented,
  Empty,
} from 'antd';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import {
  ArrowLeftOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  ShoppingCartOutlined,
  SearchOutlined,
  AppstoreOutlined,
  BarsOutlined,
  DownOutlined,
} from '@ant-design/icons';

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

type ViewMode = 'grid' | 'list';

const CartPage: React.FC<CartProps> = ({ showMessage }) => {
  const { cart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [activeGroups, setActiveGroups] = useState<ActiveGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupQuery, setGroupQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | 'host' | 'expiring'>(
    'all'
  );
  const [groupView, setGroupView] = useState<ViewMode>('grid');

  const allIds = useMemo(() => cart.map((i) => i.id), [cart]);
  const allChecked = selectedIds.length === allIds.length && allIds.length > 0;
  const indeterminate =
    selectedIds.length > 0 && selectedIds.length < allIds.length;
  const [expanded, setExpanded] = useState(false);
  const BE_BASE_URL = import.meta.env.VITE_BE_BASE_URL;

  // Load active groups
  const loadActiveGroups = async () => {
    if (!user?.user_id) return;

    setGroupsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${BE_BASE_URL}/group-orders/user/${user.user_id}/active`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Active groups loaded:', data);
        setActiveGroups(data);
      } else {
        setActiveGroups([]);
      }
    } catch (error) {
      console.error('Failed to fetch active groups:', error);
      setActiveGroups([]);
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
        pricingRuleId: i.pricing_rule?.id ?? undefined,
        pricing_rule: i.pricing_rule?.id ? { id: i.pricing_rule.id } : undefined,
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
        variant: i.variant, // giữ nguyên để check sau
      }));
      console.log('Checkout payload items:', JSON.stringify(items, null, 2));


    const groupItems = items.filter((item) => item.is_group);
    const regularItems = items.filter((item) => !item.is_group);

    if (groupItems.length > 0 && regularItems.length > 0) {
      (showMessage ?? ((_, msg) => alert(msg)))(
        'warning',
        'Không thể thanh toán cùng lúc sản phẩm thường và sản phẩm mua chung. Vui lòng chọn một loại.'
      );
      return;
    }

    // 🧩 Gộp các item theo variant (ưu tiên variant.id, nếu không có thì fallback product.id)
    const mergedItems: typeof items = [];

    for (const item of items) {
      const key = item.variant?.id ?? item.product.id;
      const existing = mergedItems.find(
        (x) => (x.variant?.id ?? x.product.id) === key
      );

      if (existing) {
        existing.quantity += item.quantity;
      } else {
        mergedItems.push({ ...item });
      }
    }

    // 🧠 Tính lại type + price dựa theo variant.pricing_rules
    const recalculatedItems = mergedItems.map((item) => {
      const rules = (item.variant as any)?.pricing_rules ?? [];
      let selectedRule = null;

      // tìm rule phù hợp nhất theo min_quantity
      for (const r of rules) {
        if (item.quantity >= r.min_quantity) {
          selectedRule = r;
        }
      }

      if (selectedRule) {
        return {
          ...item,
          type: 'bulk',
          price: selectedRule.bulk_price ?? item.price,
          pricingRuleId: selectedRule.id,
        };
      } else {
        return {
          ...item,
          type: 'normal',
          pricingRuleId: null,
        };
      }
    });

    navigate('/checkout', {
      state: { items: recalculatedItems, subtotal: selectedTotal },
    });
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

  // ===== GroupNotification (thu gọn/mở rộng + search/filter + grid/list) =====
  const filteredGroups = useMemo(() => {
    let list = [...activeGroups];
    if (groupFilter === 'host') list = list.filter((g) => g.is_host);
    if (groupFilter === 'expiring') list = list.filter((g) => !!g.expires_at);
    if (groupQuery.trim()) {
      const q = groupQuery.toLowerCase();
      list = list.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.store?.name?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeGroups, groupFilter, groupQuery]);

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
          type="info"
          showIcon
          message={
            <div className="flex items-center gap-2">
              <TeamOutlined className="text-blue-500" />
              <span>
                Bạn đang tham gia <b>{activeGroups.length}</b> đơn hàng nhóm
              </span>
            </div>
          }
          description={
            <Collapse bordered={false} defaultActiveKey={['groups']}>
              <Collapse.Panel
                key="groups"
                header={
                  <div className="flex items-center gap-2">
                    <span>Chi tiết các nhóm</span>
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {activeGroups.length} nhóm
                    </Tag>
                  </div>
                }
                extra={<DownOutlined />}
              >
                {/* Controls */}
                <Space
                  size="middle"
                  wrap
                  style={{ marginBottom: 12, width: '100%' }}
                >
                  <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="Tìm nhóm / cửa hàng"
                    value={groupQuery}
                    onChange={(e) => setGroupQuery(e.target.value)}
                    style={{ width: 280 }}
                  />
                  <Select
                    value={groupFilter}
                    onChange={(v) => setGroupFilter(v)}
                    options={[
                      { value: 'all', label: 'Tất cả' },
                      { value: 'host', label: 'Tôi là chủ nhóm' },
                      { value: 'expiring', label: 'Sắp hết hạn' },
                    ]}
                    style={{ width: 180 }}
                  />
                  <Segmented
                    value={groupView}
                    onChange={(v) => setGroupView(v as ViewMode)}
                    options={[
                      {
                        label: 'Lưới',
                        value: 'grid',
                        icon: <AppstoreOutlined />,
                      },
                      {
                        label: 'Danh sách',
                        value: 'list',
                        icon: <BarsOutlined />,
                      },
                    ]}
                  />
                </Space>

                {/* List/Grid */}
                {filteredGroups.length === 0 ? (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Không có nhóm phù hợp"
                  />
                ) : groupView === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {filteredGroups.map((group) => (
                      <Card
                        key={group.id}
                        size="small"
                        className="border-blue-200"
                        styles={{ body: { padding: 14 } }}
                      >
                        <div className="flex items-start justify-between gap-10">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {group.is_host ? (
                                <Tag color="gold" icon={<CrownOutlined />}>
                                  Chủ nhóm
                                </Tag>
                              ) : <Tag color="green" icon={<TeamOutlined />}>
                                  Thành viên
                                </Tag>}
                              {group.status === 'CLOSING' && (
                                <Tag color="red">Sắp đóng</Tag>
                              )}
                              {group.status === 'OPEN' && !group.expires_at && (
                                <Tag color="green">Đang mở</Tag>
                              )}
                            </div>
                            <div className="font-medium text-gray-900">
                              {group.name}
                            </div>
                            <div className="text-xs text-gray-600">
                              Cửa hàng:{' '}
                              <span className="text-gray-900 font-medium">
                                {group.store?.name ?? 'Không xác định'}
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 mt-1">
                              Tham gia:{' '}
                              {new Date(group.joined_at).toLocaleString(
                                'vi-VN'
                              )}
                            </div>
                            {group.expires_at && (
                              <div className="text-[12px] mt-1 inline-flex items-center gap-4 text-orange-600">
                                <ClockCircleOutlined />
                                Hết:{' '}
                                {new Date(group.expires_at).toLocaleString(
                                  'vi-VN'
                                )}
                              </div>
                            )}
                          </div>

                          <Space direction="vertical">
                            <Button
                              type="primary"
                              size="small"
                              onClick={() =>
                                navigate(`/group-orders/${group.id}/detail`)
                              }
                            >
                              Xem chi tiết
                            </Button>
                            <Button
                              size="small"
                              onClick={() =>
                                navigate(
                                  `/stores/slug/${group.store.slug}?groupId=${group.id}`
                                )
                              }
                            >
                              Mua thêm
                            </Button>
                          </Space>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Space
                    direction="vertical"
                    size="small"
                    style={{ width: '100%' }}
                  >
                    {filteredGroups.map((group) => (
                      <Card
                        key={group.id}
                        size="small"
                        className="border-blue-200"
                      >
                        <div className="flex items-start justify-between gap-8">
                          <div className="flex items-start gap-6">
                            <div className="flex items-center gap-2">
                              <TeamOutlined style={{ color: '#1677ff' }} />
                              {group.is_host ? (
                                <CrownOutlined style={{ color: '#faad14' }} />
                              ) : null}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Text strong className="text-blue-700">
                                  {group.name}
                                </Text>
                                {group.is_host && (
                                  <Tag color="gold" icon={<CrownOutlined />}>
                                    Chủ nhóm
                                  </Tag>
                                )}
                              </div>
                              <Text type="secondary" className="text-sm">
                                Cửa hàng:{' '}
                                {group.store?.name ?? 'Không xác định'}
                              </Text>
                              <br />
                              <Text type="secondary" className="text-xs">
                                Tham gia lúc:{' '}
                                {new Date(group.joined_at).toLocaleString(
                                  'vi-VN'
                                )}
                              </Text>
                            </div>
                          </div>

                          <div className="text-right">
                            {group.expires_at && (
                              <div className="flex items-center gap-6 text-sm text-orange-600 mb-2">
                                <ClockCircleOutlined />
                                <Text type="secondary" className="text-xs">
                                  Hết hạn:{' '}
                                  {new Date(group.expires_at).toLocaleString(
                                    'vi-VN'
                                  )}
                                </Text>
                              </div>
                            )}
                            <Space>
                              <Button
                                size="small"
                                type="primary"
                                onClick={() =>
                                  navigate(`/group-orders/${group.id}/detail`)
                                }
                              >
                                Xem chi tiết
                              </Button>
                              <Button
                                size="small"
                                onClick={() =>
                                  navigate(
                                    `/stores/slug/${group.store.slug}?groupId=${group.id}`
                                  )
                                }
                              >
                                Mua thêm
                              </Button>
                            </Space>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </Space>
                )}
              </Collapse.Panel>
            </Collapse>
          }
          className="border-blue-200 bg-blue-50"
        />
      </div>
    );
  };

  // ===== GroupItemsSection (mua chung) với “Xem tất cả / Thu gọn” =====
  const GroupItemsSection = () => {
    const groupItems = cart.filter((item) => item.is_group);
    if (groupItems.length === 0) return null;

    const MAX = 8;
    const visible = expanded ? groupItems : groupItems.slice(0, MAX);
    const rest = groupItems.length - visible.length;

    return (
      <div className="mb-6">
        <Card
          className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50"
          size="small"
          styles={{ body: { padding: 16 } }}
        >
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCartOutlined className="text-xl text-purple-600" />
            <span className="text-gray-900 font-semibold">
              Sản phẩm mua chung
            </span>
            <Tag color="purple">{groupItems.length} sản phẩm</Tag>
            <div className="ml-auto">
              <Button
                type="link"
                size="small"
                onClick={() => setExpanded((v) => !v)}
                icon={<DownOutlined rotate={expanded ? 180 : 0} />}
              >
                {expanded
                  ? 'Thu gọn'
                  : rest > 0
                  ? `Xem tất cả (+${rest})`
                  : 'Ẩn/Hiện'}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {visible.map((item) => (
              <Tag key={item.id} color="purple">
                {item.product.name} <b>x{item.quantity}</b>
              </Tag>
            ))}
            {!expanded && rest > 0 && (
              <Tag color="purple">+{rest} SP khác…</Tag>
            )}
          </div>

          <div className="text-xs text-gray-600 mt-2">
            Các sản phẩm này sẽ được thanh toán trong đơn hàng nhóm, không gộp
            với sản phẩm thường.
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <EveryMartHeader />

      <main className="mx-auto w-full max-w-[1500px] px-4 lg:px-6 py-6 flex-1">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center">
              <ShoppingCartOutlined className="text-white text-lg" />
            </div>
            <Title level={3} style={{ margin: 0 }}>
              Giỏ hàng của bạn
            </Title>
          </div>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => window.history.back()}
          >
            Trở về
          </Button>
        </div>

        {/* Group notification */}
        <GroupNotification />

        {cart.length === 0 ? (
          <Card className="text-center border-0 shadow-sm rounded-xl">
            <Empty
              description="Giỏ hàng trống"
              style={{ marginTop: 48, marginBottom: 48 }}
            />
            <Button
              type="primary"
              size="large"
              onClick={() => navigate('/stores')}
              className="rounded-lg"
            >
              Tiếp tục mua sắm
            </Button>
          </Card>
        ) : (
          <>
            <GroupItemsSection />

            <Row gutter={16} align="top" wrap={false}>
              <Col flex="1">
                <Card className="border-0 shadow-sm rounded-xl">
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
                </Card>
              </Col>

              <Col flex="320px">
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
