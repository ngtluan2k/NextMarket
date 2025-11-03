import React, { useState, useMemo } from 'react'; import {
    Modal,
    Card,
    Row,
    Col,
    Statistic,
    Table,
    Tag,
    Button,
    Descriptions,
    Space,
    Avatar,
    Tooltip,
    Empty,
    Badge,
    Select,
    message,
} from 'antd';
import {
    TeamOutlined,
    UserOutlined,
    ShoppingOutlined,
    DollarOutlined,
    EnvironmentOutlined,
    ClockCircleOutlined,
    EyeOutlined,
    HomeOutlined,
    PhoneOutlined,
    MailOutlined,
    CalendarOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Sale, ProductItem } from '../../../types/order';
import OrderDetailModal from './OrderDetailModal';
import { groupOrdersApi } from '../../../../service/groupOrderItems.service';



const orderStatusMap: Record<number, string> = {
    0: 'Đang Chờ Xác Nhận',
    1: 'Đã Xác Nhận',
    2: 'Đang Xử Lý',
    3: 'Đã Giao Hàng',
    4: 'Shipper Đã Giao',
    5: 'Hoàn Thành',
    6: 'Đã Hủy',
    7: 'Trả Hàng',
};

function getStatusColor(status: string | number): string {
    switch (Number(status)) {
        case 0: return 'orange';
        case 1: return 'blue';
        case 2: return 'cyan';
        case 3: return 'purple';
        case 4: return 'green';
        case 5: return 'green';
        case 6: return 'red';
        case 7: return 'magenta';
        default: return 'default';
    }
}

function getStatusText(status: number | string): string {
    return orderStatusMap[Number(status)] || 'Không Xác Định';
}

interface GroupOrderDetailModalProps {
    visible: boolean;
    onClose: () => void;
    groupData: {
        group_order_id: number;
        groupInfo: any;
        orders: Sale[];
    } | null;
    token: string;
    onStatusChange?: (orderId: number, newStatus: number, note?: string) => void;
    onRefresh?: () => void;
}

export default function GroupOrderDetailModal({
    visible,
    onClose,
    groupData,
    token,
    onStatusChange,
    onRefresh,
}: GroupOrderDetailModalProps) {
    const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null);
    const [isOrderDetailVisible, setIsOrderDetailVisible] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState<number | null>(null);

    // ✅ CÁCH SỬA: DI CHUYỂN TẤT CẢ LOGIC VÀO useMemo
    const tableDataSource = useMemo(() => {
        if (!groupData) return [];

        const { groupInfo, orders = [] } = groupData;
        const groupOrderItems = groupInfo?.items || [];

        // Group items theo member_id
        const memberItemsMap = new Map<number, any>();

        groupOrderItems.forEach((item: any) => {
            const memberId = item.member?.id;
            if (!memberId) return;

            if (!memberItemsMap.has(memberId)) {
                memberItemsMap.set(memberId, {
                    memberId,
                    member: item.member,
                    user: item.member?.user,
                    items: [],
                    totalAmount: 0,
                    totalQuantity: 0,
                });
            }

            const memberData = memberItemsMap.get(memberId);
            memberData.items.push(item);
            memberData.totalAmount += Number(item.price || 0) * Number(item.quantity || 0);
            memberData.totalQuantity += Number(item.quantity || 0);
        });

        // Convert Map to Array
        const memberList = Array.from(memberItemsMap.values());

        // Map với orders để lấy địa chỉ và status
        if (groupInfo?.delivery_mode === 'host_address') {
            // Host address mode: Dùng địa chỉ chung
            const hostOrder = orders[0];
            return memberList.map((memberData) => ({
                id: `member-${memberData.memberId}`,
                user: memberData.user,
                userAddress: hostOrder?.userAddress,
                orderItem: memberData.items,
                totalAmount: memberData.totalAmount,
                totalQuantity: memberData.totalQuantity,
                status: hostOrder?.status || 0,
                isHostAddressMode: true,
            }));
        } else {
            // Member address mode: Mỗi member có địa chỉ riêng
            return memberList.map((memberData) => {
                const memberOrder = orders.find(
                    (o) => o.user?.id === memberData.user?.id
                );

                return {
                    id: `member-${memberData.memberId}`,
                    user: memberData.user,
                    userAddress: memberOrder?.userAddress,
                    orderItem: memberData.items,
                    totalAmount: memberData.totalAmount,
                    totalQuantity: memberData.totalQuantity,
                    status: memberOrder?.status || 0,
                    orderId: memberOrder?.id,
                    isHostAddressMode: false,
                };
            });
        }
    }, [groupData]);  // ← CHỈ CẦN dependency là groupData

    if (!groupData) return null;

    const { groupInfo, orders = [], group_order_id } = groupData;
    const groupOrderItems = groupInfo?.items || [];
    const uniqueMemberIds = new Set(
        groupOrderItems.map((item: any) => item.member?.id).filter(Boolean)
    );
    const memberCount = uniqueMemberIds.size;

    // Tính toán statistics
    const totalAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const totalItems = groupOrderItems.reduce(
        (sum: number, item: any) => sum + (item.quantity || 0),
        0
    );

    // Lấy thông tin group
    const group = groupInfo;
    const host = groupInfo?.user;

    const handleUpdateGroupOrderStatus = async (newStatus: number) => {
        try {
            setIsUpdatingStatus(true);

            const response = await groupOrdersApi.updateOrderStatusBulk(group_order_id, newStatus);

            message.success(`✅ ${response.message || 'Cập nhật trạng thái thành công'}`);

            // Gọi callback để refresh data
            if (onRefresh) {
                onRefresh();
            }

            // Đóng modal và reset
            setTimeout(() => {
                onClose();
            }, 500);

        } catch (error: any) {
            console.error('❌ Lỗi cập nhật trạng thái nhóm:', error);
            message.error(
                error.response?.data?.message ||
                'Không thể cập nhật trạng thái đơn hàng nhóm'
            );
        } finally {
            setIsUpdatingStatus(false);
        }
    };



    // Handler xem chi tiết order
    const handleViewOrderDetail = (order: Sale) => {
        setSelectedOrder(order);
        setIsOrderDetailVisible(true);
    };

    // Columns cho table thành viên
    const memberColumns = [
        {
            title: 'STT',
            key: 'index',
            width: 50,
            render: (_: any, __: any, index: number) => (
                <Avatar size="small" style={{ backgroundColor: '#87d068' }}>
                    {index + 1}
                </Avatar>
            ),
        },
        {
            title: 'Thành viên',
            key: 'member',
            width: 200,
            render: (_: any, record: any) => (

                <div className="flex items-start space-x-2">
                    <Avatar icon={<UserOutlined />} />
                    <div>
                        <div className="font-medium text-gray-900">
                            {record.user?.profile?.full_name}
                        </div>
                        <div className="text-sm text-gray-500">
                            <MailOutlined className="mr-1" />
                            {record.user?.email}
                        </div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Địa chỉ giao hàng',
            key: 'address',
            render: (_: any, record: any) => {  // ← Đổi Sale thành any
                if (!record.userAddress) return <Tag>Chưa có địa chỉ</Tag>;

                return (
                    <div className="text-sm">
                        {/* ✅ THÊM 4 DÒNG NÀY: */}
                        {record.isHostAddressMode && (
                            <Tag color="green" icon={<HomeOutlined />} className="mb-2">
                                Giao chung tại địa chỉ host
                            </Tag>
                        )}
                        <div className="flex items-center mb-1">
                            <PhoneOutlined className="mr-2 text-gray-400" />
                            <span className="font-medium">{record.userAddress.phone}</span>
                        </div>
                        <div className="flex items-start">
                            <EnvironmentOutlined className="mr-2 mt-1 text-gray-400" />
                            <div className="text-gray-600">
                                <div>{record.userAddress.street}</div>
                                <div>
                                    {record.userAddress.ward}, {record.userAddress.district}
                                </div>
                                <div>{record.userAddress.province}</div>
                            </div>
                        </div>
                    </div>
                );
            },
        },

        {
            title: 'Sản phẩm',
            key: 'products',
            width: 250,
            render: (_: any, record: any) => {
                const items = record.orderItem || [];

                return (
                    <div className="space-y-1">
                        {items.slice(0, 2).map((item: ProductItem, idx: number) => (
                            <div key={idx} className="flex items-center text-sm">
                                <ShoppingOutlined className="mr-2 text-blue-500" />
                                <span>
                                    {item.product?.name}
                                    {item.variant && ` (${item.variant.variant_name})`}
                                    <span className="ml-1 text-gray-500">x{item.quantity}</span>
                                </span>
                            </div>
                        ))}
                        {items.length > 2 && (
                            <Tag className="text-xs">+{items.length - 2} sản phẩm khác</Tag>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Số lượng',
            key: 'quantity',
            width: 80,
            align: 'center' as const,
            render: (_: any, record: any) => (  // ← Đổi Sale thành any
                <span className="font-semibold">{record.totalQuantity}</span>  // ← SỬA DÒNG NÀY
            ),
        },
        {
            title: 'Tổng tiền',
            key: 'amount',
            width: 130,
            render: (_: any, record: any) => (  // ← Đổi Sale thành any
                <div className="text-right">
                    <div className="font-semibold text-lg text-blue-600">
                        ₫{parseFloat(record.totalAmount || '0').toLocaleString('vi-VN')}
                    </div>
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 150,
            render: (_: any, record: any) => (
                <Tag color={getStatusColor(record.status)}>
                    {getStatusText(record.status)}
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,  // ← Tăng width
            align: 'center' as const,
            render: (_: any, record: any) => {  // ← Đổi thành any và dùng function body
                if (record.isHostAddressMode) {
                    return (
                        <Tooltip title="Xem đơn hàng chung của nhóm">
                            <Button
                                size="small"
                                icon={<EyeOutlined />}
                                onClick={() => {
                                    if (orders[0]) {
                                        handleViewOrderDetail(orders[0]);
                                    }
                                }}
                            >
                                Order chung
                            </Button>
                        </Tooltip>
                    );
                }

                const memberOrder = orders.find((o) => o.id === record.orderId);
                if (!memberOrder) {
                    return <Tag color="red">Chưa có order</Tag>;
                }

                return (
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewOrderDetail(memberOrder)}
                    >
                        Chi tiết
                    </Button>
                );
            },
        },
    ];

    const handleOrderStatusChange = (newStatus: number, note?: string) => {
        if (selectedOrder && onStatusChange) {
            onStatusChange(selectedOrder.id, newStatus, note);
        }
    };

    return (
        <>
            <Modal
                title={
                    <div className="flex items-center space-x-2">
                        <TeamOutlined className="text-purple-600 text-xl" />
                        <span className="text-xl font-bold">Chi tiết đơn hàng nhóm</span>
                        {group?.status && (
                            <Tag color="purple" className="ml-2">
                                {group.status.toUpperCase()}
                            </Tag>
                        )}
                    </div>
                }
                open={visible}
                onCancel={onClose}
                width={1200}
                footer={[
                    <Button key="close" size="large" onClick={onClose}>
                        Đóng
                    </Button>,
                ]}
                className="group-order-detail-modal"
            >
                <div className="space-y-6">

                    {/* ✅ THÊM: Update Status Section */}
                    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold mb-2">
                                    <SyncOutlined className="mr-2" />
                                    Cập nhật trạng thái đơn hàng nhóm
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Thay đổi trạng thái sẽ áp dụng cho <strong>TẤT CẢ {orders.length} đơn hàng</strong> trong nhóm
                                </p>
                            </div>
                            <Space size="large">
                                <Select
                                    placeholder="Chọn trạng thái mới"
                                    style={{ width: 200 }}
                                    value={selectedStatus}
                                    onChange={setSelectedStatus}
                                    size="large"
                                >
                                    {Object.entries(orderStatusMap).map(([key, value]) => (
                                        <Select.Option key={key} value={Number(key)}>
                                            <Tag color={getStatusColor(Number(key))}>{value}</Tag>
                                        </Select.Option>
                                    ))}
                                </Select>
                                <Button
                                    type="primary"
                                    size="large"
                                    icon={<CheckCircleOutlined />}
                                    loading={isUpdatingStatus}
                                    disabled={selectedStatus === null}
                                    onClick={() => {
                                        if (selectedStatus !== null) {
                                            Modal.confirm({
                                                title: 'Xác nhận cập nhật trạng thái',
                                                content: (
                                                    <div>
                                                        <p>Bạn có chắc muốn cập nhật trạng thái thành:</p>
                                                        <Tag color={getStatusColor(selectedStatus)} className="mt-2">
                                                            {getStatusText(selectedStatus)}
                                                        </Tag>
                                                        <p className="mt-2 text-red-600 font-semibold">
                                                            ⚠️ Thao tác này sẽ cập nhật TẤT CẢ {orders.length} đơn hàng trong nhóm!
                                                        </p>
                                                    </div>
                                                ),
                                                onOk: () => handleUpdateGroupOrderStatus(selectedStatus),
                                                okText: 'Xác nhận',
                                                cancelText: 'Hủy',
                                            });
                                        }
                                    }}
                                    className="bg-purple-600 hover:bg-purple-700 border-purple-600"
                                >
                                    Cập nhật toàn bộ nhóm
                                </Button>
                            </Space>
                        </div>
                    </Card>
                    {/* Statistics Cards */}
                    <Row gutter={16}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="border-l-4 border-l-purple-500">
                                <Statistic
                                    title="Tổng thành viên"
                                    value={memberCount}
                                    prefix={<TeamOutlined className="text-purple-500" />}
                                    valueStyle={{ color: '#722ed1' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="border-l-4 border-l-blue-500">
                                <Statistic
                                    title="Tổng sản phẩm"
                                    value={totalItems}
                                    prefix={<ShoppingOutlined className="text-blue-500" />}
                                    valueStyle={{ color: '#1890ff' }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card className="border-l-4 border-l-green-500">
                                <Statistic
                                    title="Tổng giá trị"
                                    value={totalAmount}
                                    prefix={<DollarOutlined className="text-green-500" />}
                                    suffix="₫"
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Card>
                        </Col>

                    </Row>

                    {/* Thông tin nhóm */}
                    <Card
                        title={
                            <div className="flex items-center space-x-2">
                                <TeamOutlined />
                                <span>Thông tin nhóm</span>
                            </div>
                        }
                        className="shadow-sm"
                    >
                        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} bordered>
                            <Descriptions.Item
                                label={
                                    <span>
                                        <TeamOutlined className="mr-2" />
                                        Tên nhóm
                                    </span>
                                }
                            >
                                <span className="font-semibold text-purple-600">
                                    {group?.name || 'N/A'}
                                </span>
                            </Descriptions.Item>

                            <Descriptions.Item
                                label={
                                    <span>
                                        <UserOutlined className="mr-2" />
                                        Host
                                    </span>
                                }
                            >
                                <div>
                                    <div className="font-medium">{host?.profile?.full_name || 'N/A'}</div>
                                    <div className="text-sm text-gray-500">{host?.email}</div>
                                </div>
                            </Descriptions.Item>

                            <Descriptions.Item
                                label={
                                    <span>
                                        <HomeOutlined className="mr-2" />
                                        Chế độ giao hàng
                                    </span>
                                }
                            >
                                <Tag
                                    color={
                                        group?.delivery_mode === 'member_address' ? 'blue' : 'green'
                                    }
                                    icon={<EnvironmentOutlined />}
                                >
                                    {group?.delivery_mode === 'member_address'
                                        ? 'Giao riêng từng địa chỉ'
                                        : 'Giao chung 1 địa chỉ của host'}
                                </Tag>
                            </Descriptions.Item>

                            <Descriptions.Item
                                label={
                                    <span>
                                        <CalendarOutlined className="mr-2" />
                                        Ngày tạo
                                    </span>
                                }
                            >
                                {group?.created_at
                                    ? dayjs(group.created_at).format('DD/MM/YYYY HH:mm')
                                    : 'N/A'}
                            </Descriptions.Item>


                            <Descriptions.Item
                                label={
                                    <span>
                                        <CheckCircleOutlined className="mr-2" />
                                        Trạng thái
                                    </span>
                                }
                            >
                                <Tag
                                    color={
                                        group?.status === 'open'
                                            ? 'green'
                                            : group?.status === 'locked'
                                                ? 'orange'
                                                : group?.status === 'completed'
                                                    ? 'blue'
                                                    : 'red'
                                    }
                                    icon={
                                        group?.status === 'completed' ? (
                                            <CheckCircleOutlined />
                                        ) : group?.status === 'cancelled' ? (
                                            <CloseCircleOutlined />
                                        ) : null
                                    }
                                >
                                    {group?.status === 'open'
                                        ? 'Đang mở'
                                        : group?.status === 'locked'
                                            ? 'Đã khóa'
                                            : group?.status === 'completed'
                                                ? 'Hoàn thành'
                                                : group?.status === 'cancelled'
                                                    ? 'Đã hủy'
                                                    : group?.status}
                                </Tag>
                            </Descriptions.Item>

                            {group?.discount_percent && group.discount_percent > 0 && (
                                <Descriptions.Item
                                    label={
                                        <span>
                                            <DollarOutlined className="mr-2" />
                                            Giảm giá nhóm
                                        </span>
                                    }
                                    span={3}
                                >
                                    <Tag color="red" className="text-lg">
                                        -{group.discount_percent}%
                                    </Tag>
                                    <span className="ml-2 text-gray-500">
                                        Áp dụng khi mua nhóm
                                    </span>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Card>

                    {/* Bảng thành viên */}
                    <Card
                        title={
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    <UserOutlined />
                                    <span>Danh sách thành viên và sản phẩm</span>
                                    <Badge
                                        count={memberCount}
                                        showZero
                                        style={{ backgroundColor: '#722ed1' }}
                                    />
                                </div>
                            </div>
                        }
                        className="shadow-sm"
                    >
                        {tableDataSource.length > 0 ? (  // ← Đổi orders thành tableDataSource
                            <Table
                                dataSource={tableDataSource}  // ← Đổi orders thành tableDataSource
                                columns={memberColumns}
                                rowKey="id"
                                pagination={false}
                                scroll={{ x: 1000 }}
                                size="middle"
                                rowClassName={(record) =>  // ← Thêm function để phân biệt màu
                                    record.isHostAddressMode ? 'hover:bg-green-50' : 'hover:bg-purple-50'
                                }
                            />
                        ) : (
                            <Empty description="Chưa có thành viên nào thêm sản phẩm" />  // ← Đổi message
                        )}
                    </Card>

                    {/* Tổng kết */}
                    <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
                        <Row gutter={16}>
                            <Col span={12}>
                                <div className="text-gray-600 mb-2">Tạm tính:</div>
                                <div className="text-2xl font-semibold">
                                    ₫
                                    {orders
                                        .reduce((sum, o) => sum + Number(o.subtotal || 0), 0)
                                        .toLocaleString('vi-VN')}
                                </div>
                            </Col>
                            <Col span={12} className="text-right">
                                <div className="text-gray-600 mb-2">Tổng tiền:</div>
                                <div className="text-3xl font-bold text-purple-600">
                                    ₫{totalAmount.toLocaleString('vi-VN')}
                                </div>
                            </Col>
                        </Row>
                    </Card>
                </div>
            </Modal>

            {/* Modal chi tiết từng order */}
            {selectedOrder && (
                <OrderDetailModal
                    selectedSale={selectedOrder}
                    isDetailModalVisible={isOrderDetailVisible}
                    setIsDetailModalVisible={setIsOrderDetailVisible}
                    token={token}
                    onStatusChange={handleOrderStatusChange}
                />
            )}
        </>
    );
}