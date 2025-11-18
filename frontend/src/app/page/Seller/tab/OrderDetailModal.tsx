import React from 'react';
import { ReactNode } from 'react';
import { Modal, Tag, Table, Button, message, Spin } from 'antd';
import dayjs from 'dayjs';
import { orderService } from '../../../../service/order.service';
import { storeService } from '../../../../service/store.service';
import { Sale, ProductItem, Payment } from '../../../types/order';

// Map trạng thái số → label hiển thị
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

// Map trạng thái số → string gửi lên API (theo BE)
const orderStatusStringMap: Record<number, string> = {
  0: 'pending',
  1: 'confirmed',
  2: 'processing',
  3: 'shipped',
  4: 'delivered',
  5: 'completed',
  6: 'cancelled',
  7: 'returned',
};

function getStatusColor(status: string | number): string {
  switch (Number(status)) {
    case 0:
      return 'orange';
    case 1:
      return 'blue';
    case 2:
      return 'cyan';
    case 3:
      return 'purple';
    case 4:
      return 'green';
    case 5:
      return 'green';
    case 6:
      return 'red';
    case 7:
      return 'magenta';
    default:
      return 'default';
  }
}

export const getPaymentStatusText = (status: number | string) => {
  switch (Number(status)) {
    case 0:
      return 'Chưa thanh toán';
    case 1:
      return 'Đã thanh toán';
    case 2:
      return 'Thất bại';
    case 3:
      return 'Hoàn tiền';
    default:
      return 'Không rõ';
  }
};

export const getPaymentStatusColor = (status: number | string) => {
  switch (Number(status)) {
    case 0:
      return 'orange';
    case 1:
      return 'green';
    case 2:
      return 'red';
    case 3:
      return 'purple';
    default:
      return 'default';
  }
};

interface OrderDetailModalProps {
  selectedSale: Sale | null;
  isDetailModalVisible: boolean;
  setIsDetailModalVisible: (visible: boolean) => void;
  token: string;
  onStatusChange?: (newStatus: number, note?: string) => void;
}

export default function OrderDetailModal({
  selectedSale,
  isDetailModalVisible,
  setIsDetailModalVisible,
  token,
  onStatusChange,
}: OrderDetailModalProps) {
  const [storeId, setStoreId] = React.useState<number | null>(null);
  const [orderDetail, setOrderDetail] = React.useState<Sale | null>(null);
  const [loading, setLoading] = React.useState(false);

  // Lấy storeId khi component mount
  React.useEffect(() => {
    const fetchStore = async () => {
      try {
        const store = await storeService.getMyStore();
        if (store && store.id) {
          setStoreId(store.id);
        } else {
          throw new Error('Không tìm thấy cửa hàng');
        }
      } catch (err) {
        console.error('❌ Lỗi khi lấy store:', err);
        message.error('Không thể lấy thông tin cửa hàng.');
      }
    };
    fetchStore();
  }, []);

  // Fetch chi tiết đơn hàng khi modal mở
  React.useEffect(() => {
    if (isDetailModalVisible && selectedSale && storeId) {
      fetchOrderDetail();
    }
  }, [isDetailModalVisible, selectedSale, storeId]);

  const fetchOrderDetail = async () => {
    if (!storeId || !selectedSale) return;

    setLoading(true);
    try {
      const detail = await orderService.getStoreOrderDetail(
        storeId,
        selectedSale.id
      );
      setOrderDetail(detail);
      console.log(detail)
    } catch (err: any) {
      console.error('❌ Lỗi khi lấy chi tiết đơn hàng:', err);
      message.error('Không thể tải chi tiết đơn hàng');
      // Fallback to selectedSale if API fails
      setOrderDetail(selectedSale);
    } finally {
      setLoading(false);
    }
  };
  const getItemPreGroupPrice = (price: number, discountPercent: number) => {
    const factor = 1 - discountPercent / 100;
    return Math.round(price / factor);
  };

  const productColumns = [
    {
      title: 'Sản phẩm',
      dataIndex: 'product',
      key: 'product',
      render: (product: any, record: any) => (
        <>
          {product?.name}
          {record.variant ? ` (${record.variant.variant_name})` : ''}
        </>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      render: (price: string, record: any) => {
        const priceNum = parseFloat(price || '0');

        // Nếu là đơn hàng nhóm, hiển thị giá gốc
        if (displayOrder?.group_order_id && displayOrder?.group_order?.discount_percent) {
          const originalPrice = getItemPreGroupPrice(
            priceNum,
            displayOrder.group_order.discount_percent
          );
          return `₫${originalPrice.toLocaleString('vi-VN')}`;
        }

        // Đơn hàng thường: hiển thị price như cũ
        return `₫${priceNum.toLocaleString('vi-VN')}`;
      },
    },
    {
      title: 'Giảm giá',
      dataIndex: 'discount',
      key: 'discount',
      render: (_: string, record: any) => {
        const discountPercent = displayOrder?.group_order?.discount_percent || 0;

        if (displayOrder?.group_order_id && discountPercent > 0) {
          const priceNum = parseFloat(record.price || '0');
          const feedPrice = getItemPreGroupPrice(
            priceNum,
            discountPercent
          );
          const discountAmount = feedPrice - priceNum;

          return discountAmount > 0
            ? `-${discountAmount.toLocaleString('vi-VN')}đ`
            : '-';
        }

        const discountNum = parseFloat(record.discount || '0');
        return discountNum > 0
          ? `-₫${discountNum.toLocaleString('vi-VN')}`
          : '-';
      },
    },
    {
      title: 'Tạm tính',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (subtotal: string, record: any) => {
        // Nếu là đơn hàng nhóm, hiển thị price × quantity (giá gốc)
        if (displayOrder?.group_order_id) {
          const originalPrice = parseFloat(record.price || '0');
          return `₫${originalPrice.toLocaleString('vi-VN')}`;
        }
        // Đơn hàng thường: hiển thị subtotal như cũ
        return `₫${parseFloat(subtotal).toLocaleString('vi-VN')}`;
      },
    }
  ];

  // Hàm đổi trạng thái (PATCH theo BE)
  const handleChangeStatus = async (newStatus: number, note: string) => {
    if (!storeId || !orderDetail) {
      message.error('Không tìm thấy cửa hàng hoặc đơn hàng.');
      return;
    }

    try {
      const statusStr = orderStatusStringMap[newStatus];

      console.log('🔄 Đang cập nhật trạng thái...');
      console.log('Store ID:', storeId);
      console.log('Order ID:', orderDetail.id);
      console.log('Status string:', statusStr);
      console.log('Note:', note);

      // Call API PATCH theo route BE: /stores/:storeId/orders/:id/status/:status
      await orderService.changeStatusByStore(
        storeId,
        orderDetail.id,
        statusStr,
        note
      );

      message.success('Cập nhật trạng thái thành công');

      // Callback để refresh data ở parent
      if (onStatusChange) {
        onStatusChange(newStatus, note);
      }

      // Refresh chi tiết đơn hàng
      await fetchOrderDetail();

      setIsDetailModalVisible(false);
    } catch (err: any) {
      console.error('❌ Lỗi cập nhật trạng thái:', err);
      message.error(err.message || 'Cập nhật trạng thái thất bại');
    }
  };

  // Footer theo trạng thái
  const renderFooter = () => {
    if (!orderDetail) return null;

    const status = Number(orderDetail.status);
    const buttons: ReactNode[] = [];

    // Thêm nút đóng
    buttons.push(
      <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
        Đóng
      </Button>
    );

    if (orderDetail.group_order_id) {
      return buttons;
    }

    // Trạng thái 0: Đang chờ xác nhận
    if (status === 0) {
      buttons.push(
        <Button
          key="confirm"
          type="primary"
          onClick={() => handleChangeStatus(1, 'Người bán xác nhận đơn hàng')}
        >
          Xác Nhận Đơn
        </Button>
      );
      buttons.push(
        <Button
          key="cancel"
          danger
          onClick={() => handleChangeStatus(6, 'Người bán hủy đơn')}
        >
          Hủy Đơn
        </Button>
      );
    }
    // Trạng thái 1 hoặc 2: Đã xác nhận / Đang xử lý
    else if (status === 1 || status === 2) {
      buttons.push(
        <Button
          key="processing"
          type="primary"
          onClick={() => handleChangeStatus(2, 'Đơn hàng đang được xử lý')}
        >
          Đang Xử Lý
        </Button>
      );
      buttons.push(
        <Button
          key="shipped"
          type="primary"
          onClick={() => handleChangeStatus(3, 'Đơn hàng đã giao cho shipper')}
        >
          Đã Giao Hàng
        </Button>
      );
      // buttons.push(
      //   <Button
      //     key="cancel"
      //     danger
      //     onClick={() => handleChangeStatus(6, 'Người bán hủy đơn')}
      //   >
      //     Hủy Đơn
      //   </Button>
      // );
    }
    // Trạng thái 3: Đã giao hàng
    else if (status === 3) {
      buttons.push(
        <Button
          key="delivered"
          type="primary"
          onClick={() =>
            handleChangeStatus(4, 'Shipper đã giao hàng cho khách')
          }
        >
          Shipper Đã Giao
        </Button>
      );
    }
    // Trạng thái 4: Shipper đã giao
    else if (status === 4) {
      buttons.push(
        <Button
          key="complete"
          type="primary"
          onClick={() => handleChangeStatus(5, 'Đơn hàng hoàn thành')}
        >
          Hoàn Thành
        </Button>
      );
    }

    return buttons;
  };

  if (!selectedSale && !orderDetail) return null;

  const displayOrder = orderDetail || selectedSale;

  return (
    <Modal
      title={`Chi tiết đơn hàng #${displayOrder?.orderNumber || displayOrder?.id
        }`}
      open={isDetailModalVisible}
      onCancel={() => setIsDetailModalVisible(false)}
      footer={renderFooter()}
      width={900}
    >
      <Spin spinning={loading}>
        {displayOrder && (
          <>
            {/* Thông tin khách hàng */}
            <div className="mb-4 p-4 bg-gray-50 rounded">
              <h3 className="font-semibold text-lg mb-3">
                📋 Thông tin khách hàng
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Tên khách hàng:</p>
                  <p className="font-medium">{displayOrder.user?.username}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email:</p>
                  <p className="font-medium">{displayOrder.user?.email}</p>
                </div>
              </div>

              {displayOrder.userAddress && (
                <div className="mt-3">
                  <p className="text-gray-600">Địa chỉ giao hàng:</p>
                  <p className="font-medium">
                    {displayOrder.userAddress.recipientName} -{' '}
                    {displayOrder.userAddress.phone}
                  </p>
                  <p className="text-sm text-gray-700">
                    {displayOrder.userAddress.street},{' '}
                    {displayOrder.userAddress.ward},{' '}
                    {displayOrder.userAddress.district},{' '}
                    {displayOrder.userAddress.province}
                  </p>
                </div>
              )}
            </div>

            {/* Bảng sản phẩm */}
            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-3">🛒 Sản phẩm</h3>
              <Table
                dataSource={displayOrder.orderItem}
                columns={productColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>

            {/* Tổng quan đơn hàng */}
            <div className="p-4 bg-gray-50 rounded space-y-3">
              <h3 className="font-semibold text-lg mb-3">💰 Tổng quan</h3>

              <div className="flex justify-between">
                <span className="text-gray-600">Tạm tính:</span>
                <span className="font-medium">
                  ₫{parseFloat(displayOrder.subtotal).toLocaleString('vi-VN')}
                </span>
              </div>

              {displayOrder.discountTotal &&
                parseFloat(displayOrder.discountTotal) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Giảm giá:</span>
                    <span>
                      -₫
                      {parseFloat(displayOrder.discountTotal).toLocaleString(
                        'vi-VN'
                      )}
                    </span>
                  </div>
                )}

              <div className="flex justify-between">
                <span className="text-gray-600">Phí vận chuyển:</span>
                <span className="font-medium">
                  ₫
                  {parseFloat(displayOrder.shippingFee).toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="flex justify-between border-t pt-2">
                <span className="font-bold text-lg">Tổng tiền:</span>
                <span className="font-bold text-lg text-blue-600">
                  ₫
                  {parseFloat(displayOrder.totalAmount).toLocaleString('vi-VN')}
                </span>
              </div>

              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-gray-600">Trạng thái đơn hàng:</span>
                <Tag
                  color={getStatusColor(displayOrder.status)}
                  className="text-sm"
                >
                  {orderStatusMap[Number(displayOrder.status)] ||
                    'Không xác định'}
                </Tag>
              </div>

              {displayOrder.payment && displayOrder.payment.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Trạng thái thanh toán:</span>
                  <Tag
                    color={getPaymentStatusColor(
                      Number(displayOrder.payment[0].status)
                    )}
                    className="text-sm"
                  >
                    {getPaymentStatusText(
                      Number(displayOrder.payment[0].status)
                    )}
                  </Tag>
                </div>
              )}

              <div className="flex justify-between text-sm text-gray-500 border-t pt-2">
                <span>Ngày tạo:</span>
                <span>
                  {dayjs(displayOrder.createdAt).format('DD/MM/YYYY HH:mm')}
                </span>
              </div>

              {displayOrder.notes && (
                <div className="border-t pt-2">
                  <p className="text-gray-600 text-sm">Ghi chú:</p>
                  <p className="text-sm italic">{displayOrder.notes}</p>
                </div>
              )}
            </div>
          </>
        )}
      </Spin>
    </Modal>
  );
}
