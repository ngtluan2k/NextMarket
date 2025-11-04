import React, { useState, useEffect } from 'react';
import { Modal, Button, Select, message, Card, Divider } from 'antd';
import { CreditCardOutlined, EnvironmentOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { groupOrderItemsApi,userApi, paymentApi } from '../../../../service/groupOrderItems.service';
import AddressModal from '../../../page/AddressModal';
import { UserAddress } from '../../../types/user';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

interface GroupOrderCheckout {
    open: boolean;
    onClose: () => void;
    groupId: number;
    groupItems: any[];
    totalAmount: number; // Đây là giá đã giảm (totalAfter từ GroupOrderDetail)
    discountPercent: number;
    onSuccess?: () => void;
    deliveryMode: 'host_address' | 'member_address';
}

export const GroupOrderCheckout: React.FC<GroupOrderCheckout> = ({
    open,
    onClose,
    groupId,
    groupItems,
    totalAmount, // Đã là giá đã giảm
    discountPercent,
    deliveryMode,
    onSuccess
}) => {
    const { me } = useAuth();
    const [loading, setLoading] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addresses, setAddresses] = useState<UserAddress[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
    const navigate = useNavigate();

    // Load data khi modal mở
    useEffect(() => {
        if (open) {
            loadCheckoutData();
        }
    }, [open]);

    const loadCheckoutData = async () => {
        try {
            console.log('🔍 Loading checkout data...');
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('❌ No token found');
                message.error('Vui lòng đăng nhập để tiếp tục');
                return;
            }
            const userId = me?.user_id || me?.id || Number(localStorage.getItem('userId'));
            if (!userId) {
                message.error('Vui lòng đăng nhập để tiếp tục');
                return;
            }
            if (deliveryMode === 'host_address') {
                  const [addressesRes, paymentMethodsRes] = await Promise.all([
                    userApi.getAddresses(userId),
                    paymentApi.getPaymentMethods() 
                ]);

                console.log(' Addresses:', addressesRes.data);
                console.log(' Payment Methods:', paymentMethodsRes.data);

                const addressesData = addressesRes || [];
                setAddresses(addressesData);
                setPaymentMethods(paymentMethodsRes || []);

                // Auto-select default address
                const defaultAddress = addressesData.find((a: UserAddress) => a.isDefault) || addressesData[0];
                if (defaultAddress) {
                    setSelectedAddress(defaultAddress);
                }

            } else {
                // member_address mode: chỉ load payment methods
                const paymentMethodsRes = await paymentApi.getPaymentMethods();
                setPaymentMethods(paymentMethodsRes || []);
            }
        } catch (error) {
            console.error('Failed to load checkout data:', error);
            message.error('Không thể tải dữ liệu thanh toán');
        }
    };

    const handleCheckout = async () => {
        console.log('🔍 Debug Checkout:', {
            deliveryMode,
            selectedAddress,
            selectedPaymentMethod,
        });

        //   Validate theo delivery_mode
        if (deliveryMode === 'host_address' && !selectedAddress) {
            message.error('Vui lòng chọn địa chỉ giao hàng');
            return;
        }

        if (!selectedPaymentMethod) {
            message.error('Vui lòng chọn phương thức thanh toán');
            return;
        }

        setLoading(true);
        try {
            //  Tạo payload theo delivery_mode
            const payload: any = {
                paymentMethodUuid: selectedPaymentMethod
            };

            // Chỉ gửi addressId nếu là host_address
            if (deliveryMode === 'host_address' && selectedAddress) {
                payload.addressId = selectedAddress.id;
            }

            console.log('📤 Checkout payload:', payload);

            const response = await groupOrderItemsApi.checkout(groupId, payload);

            console.log(' Checkout response:', response);

            if (response.redirectUrl) {
                console.log('🔄 Redirecting to external payment:', response.redirectUrl);
                window.location.href = response.redirectUrl;
            } else {
                console.log(' Payment successful, navigating to success page');
                message.success('Thanh toán thành công!');

                onClose();

                navigate('/order-success', {
                    state: {
                        orderCode: response.orderUuid || response.orderCode,
                        total: totals.totalAfter,
                        paymentMethodLabel: paymentMethods.find(pm => pm.uuid === selectedPaymentMethod)?.name || 'Unknown',
                        items: groupItems,
                        isGroupOrder: true,
                        groupId: groupId,
                        discountPercent: discountPercent,
                        originalTotal: totals.subtotalBefore,
                        savedAmount: totals.discountAmount,
                        memberCount: groupItems.length > 0 ? new Set(groupItems.map(item => item.member?.user?.id)).size : 0,
                        deliveryMode: deliveryMode, // ← Thêm info
                        orderCount: response.orderCount || 1, // ← Số orders được tạo
                    },
                    replace: true
                });

                onSuccess?.();
            }
        } catch (error: any) {
            console.error('❌ Checkout error:', error);
            const errorMessage = error?.response?.data?.message || 'Thanh toán thất bại';
            message.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleAddressSelect = (address: UserAddress) => {
        setSelectedAddress(address);
        setShowAddressModal(false);
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    };

    // Helper tính giá trước giảm nhóm 
    const getItemPreGroupPrice = (item: any, discountPercent: number) => {
        const p = Number(item?.price) || 0;
        if (!discountPercent) return p;
        const factor = 1 - discountPercent / 100;
        return factor > 0 ? Math.round(p / factor) : p;
    };

    // Tính tổng với tách rõ tạm tính/giảm giá/thành tiền 
    const calcTotals = (items: any[], discountPercent: number) => {
        if (!Array.isArray(items) || items.length === 0) {
            return { subtotalBefore: 0, discountAmount: 0, totalAfter: 0 };
        }
        const totalAfter = items.reduce((sum, item) => sum + (Number(item?.price) || 0), 0);
        const subtotalBefore = items.reduce(
            (sum, item) => sum + getItemPreGroupPrice(item, discountPercent),
            0
        );
        const discountAmount = Math.max(subtotalBefore - totalAfter, 0);
        return { subtotalBefore, discountAmount, totalAfter };
    };

    // Tính totals giống GroupOrderDetail
    const totals = React.useMemo(() => {
        const items = Array.isArray(groupItems) && groupItems.length > 0
            ? groupItems
            : [];
        return calcTotals(items, discountPercent);
    }, [groupItems, discountPercent]);

    return (
        <>
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <ShoppingCartOutlined className="text-green-600" />
                        <span>Thanh toán cho nhóm</span>
                    </div>
                }
                open={open}
                onCancel={onClose}
                footer={null}
                width={700}
                className="group-order-checkout-modal"
            >
                <div className="space-y-6">
                    {/* ✅ Hiển thị thông báo về delivery mode */}
                    <Alert
                        message={
                            deliveryMode === 'host_address'
                                ? '📦 Giao hàng tập trung - Tất cả sản phẩm sẽ giao về địa chỉ của chủ nhóm'
                                : '🚚 Giao hàng riêng - Mỗi thành viên nhận hàng tại địa chỉ của mình'
                        }
                        type="info"
                        icon={<InfoCircleOutlined />}
                        showIcon
                    />

                    {/* Order Summary */}
                    <Card title="Tóm tắt đơn hàng" size="small">
                        <div className="space-y-2">
                            {groupItems.map((item, index) => (
                                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{item.product?.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {item.member?.user?.profile?.full_name || item.member?.user?.username || 'Member'} • {item.quantity} x {formatPrice(getItemPreGroupPrice(item, discountPercent) / item.quantity)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">{formatPrice(getItemPreGroupPrice(item, discountPercent))}</p>
                                    </div>
                                </div>
                            ))}

                            <Divider />

                            <div className="space-y-1">
                                <div className="flex justify-between">
                                    <span>Tạm tính:</span>
                                    <span>{formatPrice(totals.subtotalBefore)}</span>
                                </div>
                                {discountPercent > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Giảm giá nhóm ({discountPercent}%):</span>
                                        <span>-{formatPrice(totals.discountAmount)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold text-green-600">
                                    <span>Tổng cộng:</span>
                                    <span>{formatPrice(totals.totalAfter)}</span>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* ✅ Chỉ hiển thị Address Selection khi deliveryMode = host_address */}
                    {deliveryMode === 'host_address' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <EnvironmentOutlined className="mr-1" />
                                Địa chỉ giao hàng
                            </label>
                            {selectedAddress ? (
                                <Card size="small" className="mb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900">
                                                {selectedAddress.recipientName} | {selectedAddress.phone}
                                            </p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {selectedAddress.fullAddress ||
                                                    [selectedAddress.street, selectedAddress.ward, selectedAddress.district, selectedAddress.province]
                                                        .filter(Boolean)
                                                        .join(', ')
                                                }
                                            </p>
                                            {selectedAddress.isDefault && (
                                                <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                                                    Mặc định
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ) : (
                                <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center mb-2">
                                    <p className="text-gray-500">Chưa chọn địa chỉ</p>
                                </div>
                            )}
                            <Button
                                type="link"
                                onClick={() => setShowAddressModal(true)}
                                className="p-0 h-auto"
                            >
                                {selectedAddress ? 'Thay đổi địa chỉ' : 'Chọn địa chỉ'}
                            </Button>
                        </div>
                    )}

                    {/* Payment Method Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <CreditCardOutlined className="mr-1" />
                            Phương thức thanh toán
                        </label>
                        <Select
                            placeholder="Chọn phương thức thanh toán"
                            value={selectedPaymentMethod}
                            onChange={(value: string) => {
                                console.log('🔍 Selected payment method:', value);
                                setSelectedPaymentMethod(value);
                            }}
                            className="w-full"
                            size="large"
                        >
                            {paymentMethods.map((method) => (
                                <Select.Option key={method.uuid} value={method.uuid}>
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={method.icon}
                                            alt={method.name}
                                            className="w-6 h-6 object-contain"
                                        />
                                        <span>{method.name}</span>
                                    </div>
                                </Select.Option>
                            ))}
                        </Select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button onClick={onClose} size="large">
                            Hủy
                        </Button>
                        <Button
                            type="primary"
                            size="large"
                            loading={loading}
                            onClick={handleCheckout}
                            disabled={
                                (deliveryMode === 'host_address' && !selectedAddress) ||
                                !selectedPaymentMethod
                            }
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {loading ? 'Đang xử lý...' : `Thanh toán ${formatPrice(totals.totalAfter)}`}
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Address Selection Modal - chỉ render khi cần */}
            {deliveryMode === 'host_address' && (
                <AddressModal
                    visible={showAddressModal}
                    onClose={() => setShowAddressModal(false)}
                    onSelect={handleAddressSelect}
                    currentAddressId={selectedAddress?.id}
                />
            )}
        </>
    );
};