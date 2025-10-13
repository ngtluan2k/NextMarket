import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Tag,
  Divider,
  Modal,
  Input,
  message,
  Spin,
} from 'antd';
import { useMySubscriptions } from '../../hooks/useMySubscriptions';
import { useUseSubscription } from '../../hooks/useUseSubscription';
import AddressModal from '../AddressModal';
import { Subscription } from '../../types/subscription';
import { UserAddress } from '../../types/user';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/api';
import dayjs from 'dayjs';
import { InputNumber } from 'antd';

const { Title, Text } = Typography;
const { TextArea } = Input;

export function MySubscriptionsPage() {
  const { subscriptions, loading, error, reload } = useMySubscriptions();
  const { execute, loading: using } = useUseSubscription();
  const { me } = useAuth();

  const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(
    null
  );
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [currentSubscription, setCurrentSubscription] =
    useState<Subscription | null>(null);
  const [note, setNote] = useState('');
  const [useQuantity, setUseQuantity] = useState(1);

  useEffect(() => {
    const fetchDefaultAddress = async () => {
      if (!me?.id) return;

      try {
        const res = await api.get(`/users/${me.id}/addresses`);
        // Lấy địa chỉ mặc định
        const defaultAddress = res.data.find((a: UserAddress) => a.isDefault);
        if (defaultAddress) setSelectedAddress(defaultAddress);
      } catch (err) {
        console.error('Error loading default address:', err);
        message.error('Không thể tải địa chỉ mặc định');
      }
    };

    fetchDefaultAddress();
  }, [me?.id]);
  const getImageUrl = (path?: string) => {
    if (!path) return '';
    // Nếu đã có http thì trả nguyên, nếu không thì ghép base URL backend
    return path.startsWith('http') ? path : `http://localhost:3000${path}`;
  };

  const handleUseClick = (sub: Subscription) => {
    if (!selectedAddress) {
      message.warning('Vui lòng chọn địa chỉ giao hàng');
      setAddressModalVisible(true);
      return;
    }
    setCurrentSubscription(sub);
    setUseQuantity(1);
    setConfirmModalVisible(true);
  };

  const handleConfirmUse = async () => {
    if (!currentSubscription || !selectedAddress) return;

    setConfirmModalVisible(false);
    try {
      await execute({
        subscriptionId: currentSubscription.id,
        usedQuantity: useQuantity,
        addressId: selectedAddress.id,
        note,
      });
      message.success(
        `Gói "${currentSubscription.name}" đã được sử dụng thành công!`
      );
      setNote('');
      reload();
    } catch (err: any) {
      message.error(err?.message || 'Sử dụng gói thất bại');
      console.error('Error using subscription:', err);
    }
  };

  if (loading)
    return <Spin size="large" tip="Đang tải các gói subscription..." />;
  if (error) return <Text type="danger">{error}</Text>;

  return (
    <div
      style={{
        display: 'flex',
        gap: 24,
        padding: 24,
        maxWidth: 1200,
        margin: '0 auto',
      }}
    >
      {/* --- Left: Subscriptions --- */}
      <div
        style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <Title level={2}>Các gói subscription của tôi</Title>
        {subscriptions.length === 0 && (
          <Text type="secondary">Bạn chưa có gói subscription nào.</Text>
        )}
        {subscriptions.map((sub) => (
          <Card
            key={sub.id}
            hoverable
            style={{ position: 'relative', overflow: 'hidden' }}
          >
            {/* Image góc phải */}
            {sub.product?.media?.[0] && (
              <img
                src={getImageUrl(sub.product.media[0].url)}
                alt={sub.product.name}
                style={{
                  width: 120,
                  height: 120,
                  objectFit: 'cover',
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  borderRadius: 8,
                }}
              />
            )}

            {/* Nội dung text */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Text strong style={{ fontSize: 16 }}>
                {sub.name}
              </Text>
              <p>
                {sub.product?.name || '—'} ({sub.variant?.variant_name || '—'})
              </p>
              {sub.product?.store && (
                <Text type="secondary">
                  {sub.product.store.logo_url && (
                    <img
                      src={getImageUrl(sub.product.store.logo_url)}
                      alt={sub.product.store.name}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        marginRight: 4,
                      }}
                    />
                  )}
                  {sub.product.store.name}
                </Text>
              )}
              <p>
                Thời hạn:{' '}
                <Text>
                  {sub.startDate
                    ? dayjs(sub.startDate).format('HH:mm, DD/MM/YYYY')
                    : '—'}{' '}
                  -{' '}
                  {sub.endDate
                    ? dayjs(sub.endDate).format('HH:mm, DD/MM/YYYY')
                    : '—'}
                </Text>
              </p>
              <Divider />
              <p>
                <Text>Số lượng: </Text>
                <Tag color={sub.remainingQuantity > 0 ? 'green' : 'red'}>
                  {sub.remainingQuantity} / {sub.totalQuantity}
                </Tag>
              </p>
              <p>
                <Text>Gói: </Text>
                {sub.cycle} ngày
              </p>
              <p>
                <Text>Trạng thái: </Text>
                <Tag color={sub.status === 'active' ? 'blue' : 'gray'}>
                  {sub.status}
                </Tag>
              </p>

              {/* Button full width */}
              <Button
                type="primary"
                block
                disabled={
                  sub.remainingQuantity <= 0 || using || sub.status !== 'active'
                }
                loading={using}
                onClick={() => handleUseClick(sub)}
              >
                Sử dụng gói
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* --- Right: Address Selector --- */}
      <div style={{ flex: 1 }}>
        <div style={{ position: 'sticky', top: 24 }}>
          <Card style={{ width: 300 }}>
            <Text strong>Giao tới</Text>
            <Button
              type="link"
              size="small"
              onClick={() => setAddressModalVisible(true)}
            >
              Thay đổi
            </Button>
            <p>
              {selectedAddress ? (
                <>
                  <strong>{selectedAddress.recipientName}</strong> |{' '}
                  {selectedAddress.phone}
                  <br />
                  {[
                    selectedAddress.street,
                    selectedAddress.ward,
                    selectedAddress.district,
                    selectedAddress.province,
                    selectedAddress.country,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </>
              ) : (
                <Text type="secondary">Vui lòng chọn địa chỉ giao hàng</Text>
              )}
            </p>
          </Card>
        </div>
      </div>

      {/* --- Address Modal --- */}
      <AddressModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onSelect={(addr) => setSelectedAddress(addr)}
        currentAddressId={selectedAddress?.id}
      />

      {/* --- Confirm Modal --- */}
      <Modal
        title="Xác nhận sử dụng gói subscription"
        open={confirmModalVisible}
        onCancel={() => setConfirmModalVisible(false)}
        onOk={handleConfirmUse}
        okText="Xác nhận"
        cancelText="Hủy"
        width={700}
      >
        {currentSubscription && selectedAddress && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start',
              flexWrap: 'wrap',
            }}
          >
            {/* --- Thông tin subscription + ảnh sản phẩm --- */}
            <div style={{ display: 'flex', flex: 1, gap: 16 }}>
              {/* Thông tin subscription */}
              <div style={{ flex: 1 }}>
                <Text strong style={{ fontSize: 16 }}>
                  {currentSubscription.name}
                </Text>
                <p>
                  <Text>Product:</Text>{' '}
                  {currentSubscription.product?.name || '—'} (
                  {currentSubscription.variant?.variant_name || '—'})
                </p>
                <p>
                  Số lượng còn lại: {currentSubscription.remainingQuantity} /{' '}
                  {currentSubscription.totalQuantity}
                </p>
                <p>
                  <Text>Số lượng muốn sử dụng:</Text>
                  <InputNumber
                    min={1}
                    max={currentSubscription.remainingQuantity}
                    value={useQuantity}
                    onChange={(value) => setUseQuantity(value || 1)}
                    style={{ marginLeft: 8, width: 100 }}
                  />
                </p>
                <p>
                  <Text>Thời hạn:</Text>{' '}
                  {currentSubscription.startDate
                    ? dayjs(currentSubscription.startDate).format(
                        'HH:mm, DD/MM/YYYY'
                      )
                    : '—'}{' '}
                  -{' '}
                  {currentSubscription.endDate
                    ? dayjs(currentSubscription.endDate).format(
                        'HH:mm, DD/MM/YYYY'
                      )
                    : '—'}
                </p>
                <p>
                  <Text>Số lượng còn lại:</Text>{' '}
                  {currentSubscription.remainingQuantity} /{' '}
                  {currentSubscription.totalQuantity}
                </p>
                <p>
                  <Text>Cycle:</Text> {currentSubscription.cycle} ngày
                </p>
                <p>
                  <Text>Trạng thái:</Text>{' '}
                  <Tag
                    color={
                      currentSubscription.status === 'active' ? 'blue' : 'gray'
                    }
                  >
                    {currentSubscription.status}
                  </Tag>
                </p>
              </div>

              {/* --- Hình ảnh sản phẩm --- */}
              {currentSubscription &&
                currentSubscription.product?.media &&
                currentSubscription.product.media.length > 0 && (
                  <img
                    src={getImageUrl(currentSubscription.product.media[0].url)}
                    alt={currentSubscription.product.name}
                    style={{
                      width: 120,
                      height: 120,
                      objectFit: 'cover',
                      borderRadius: 8,
                    }}
                  />
                )}
            </div>

            <Divider />

            {/* Store */}
            {currentSubscription.product?.store && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                {currentSubscription.product.store.logo_url && (
                  <img
                    src={getImageUrl(
                      currentSubscription.product.store.logo_url
                    )}
                    alt={currentSubscription.product.store.name}
                    style={{ width: 32, height: 32, borderRadius: '50%' }}
                  />
                )}
                <Text>Store: {currentSubscription.product.store.name}</Text>
              </div>
            )}

            <Divider />

            {/* Địa chỉ giao hàng + ghi chú */}
            <div style={{ flex: 1 }}>
              <p>
                <Text>Địa chỉ giao hàng:</Text>
                <br />
                {selectedAddress.recipientName} | {selectedAddress.phone}
                <br />
                {[
                  selectedAddress.street,
                  selectedAddress.ward,
                  selectedAddress.district,
                  selectedAddress.province,
                  selectedAddress.country,
                ]
                  .filter(Boolean)
                  .join(', ')}
              </p>

              <Divider />

              <Text>Ghi chú:</Text>
              <TextArea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú (nếu có)"
                rows={3}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
