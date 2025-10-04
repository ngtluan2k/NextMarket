import React from 'react';
import { ReactNode } from 'react';
import { Modal, Tag, Table, Button, message } from 'antd';
import dayjs from 'dayjs';
import { Sale } from './Sale';
import { orderService } from '../../../../service/order.service';

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

// Map trạng thái số → string gửi lên API
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
      return 'orange'; // Pending
    case 1:
      return 'blue'; // Confirmed
    case 2:
      return 'cyan'; // Processing
    case 3:
      return 'purple'; // Shipped
    case 4:
      return 'green'; // Delivered
    case 5:
      return 'green'; // Completed
    case 6:
      return 'red'; // Cancelled
    case 7:
      return 'magenta'; // Returned
    default:
      return 'default';
  }
}
export const getPaymentStatusText = (status: number | string) => {
  switch (status) {
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
  switch (status) {
    case 0:
      return 'orange'; // Pending
    case 1:
      return 'green'; // Completed
    case 2:
      return 'red'; // Failed
    case 3:
      return 'purple'; // Refunded
    default:
      return 'default';
  }
};

interface OrderDetailModalProps {
  selectedSale: Sale | null;
  isDetailModalVisible: boolean;
  setIsDetailModalVisible: (visible: boolean) => void;
  token: string;
  onStatusChange?: (newStatus: number) => void;
}

export default function OrderDetailModal({
  selectedSale,
  isDetailModalVisible,
  setIsDetailModalVisible,
  token,
  onStatusChange,
}: OrderDetailModalProps) {
  if (!selectedSale) return null;

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
      render: (price: string) =>
        `₫${parseFloat(price).toLocaleString('vi-VN')}`,
    },
    {
      title: 'Tạm tính',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (subtotal: string) =>
        `₫${parseFloat(subtotal).toLocaleString('vi-VN')}`,
    },
  ];

  // Hàm đổi trạng thái
  const handleChangeStatus = async (newStatus: number, note: string) => {
    try {
      const statusStr = orderStatusStringMap[newStatus]; // convert số → string
      console.log('--- DEBUG Sending changeStatus ---');
      console.log('Order ID:', selectedSale.id);
      console.log('Status string:', statusStr);
      console.log('Note:', note);
      console.log('Token:', token);
      await orderService.changeStatus(selectedSale.id, statusStr, token, note);
      message.success('Cập nhật trạng thái thành công');
      if (onStatusChange) onStatusChange(newStatus);

      setIsDetailModalVisible(false);
    } catch (err) {
      console.error('Lỗi cập nhật:', err);
      message.error('Cập nhật thất bại');
    }
  };

  // Footer theo trạng thái
  const renderFooter = () => {
    const status = Number(selectedSale.status);
    const buttons: ReactNode[] = [];

    if (status === 0) {
      buttons.push(
        <Button
          key="confirm"
          type="primary"
          onClick={() => handleChangeStatus(1, 'Người bán xác nhận')}
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
    } else if (status === 1 || status === 2) {
      buttons.push(
        <Button
          key="cancel"
          danger
          onClick={() => handleChangeStatus(6, 'Người bán hủy đơn')}
        >
          Hủy Đơn
        </Button>
      );
    } else if (status === 3) {
      buttons.push(
        <Button
          key="complete"
          type="primary"
          onClick={() => handleChangeStatus(5, 'Đơn đã hoàn thành')}
        >
          Hoàn Thành
        </Button>
      );
    }

    return buttons;
  };

  return (
    <Modal
      title={`Chi tiết đơn hàng #${selectedSale.id}`}
      open={isDetailModalVisible}
      onCancel={() => setIsDetailModalVisible(false)}
      footer={renderFooter()}
      width={800}
    >
      {/* Thông tin khách hàng */}
      <div className="mb-4">
        <h3 className="font-semibold">Khách hàng</h3>
        <p>
          {selectedSale.user?.username} ({selectedSale.user?.email})
        </p>
        {selectedSale.userAddress && (
          <p>
            {selectedSale.userAddress.recipientName} -{' '}
            {selectedSale.userAddress.phone}
            <br />
            {selectedSale.userAddress.street}, {selectedSale.userAddress.ward},{' '}
            {selectedSale.userAddress.district},{' '}
            {selectedSale.userAddress.province}
          </p>
        )}
      </div>

      {/* Bảng sản phẩm */}
      <Table
        dataSource={selectedSale.orderItem}
        columns={productColumns}
        rowKey="id"
        pagination={false}
      />

      {/* Tổng quan đơn hàng */}
      <div className="mt-4 space-y-2">
        <p>
          <strong>Tổng tiền:</strong> ₫
          {parseFloat(selectedSale.totalAmount).toLocaleString('vi-VN')}
        </p>
        <p>
          <strong>Trạng thái đơn hàng:</strong>{' '}
          <Tag color={getStatusColor(selectedSale.status)}>
            {orderStatusMap[Number(selectedSale.status)] || 'Không xác định'}
          </Tag>
        </p>
        <p>
          <strong>Ngày tạo:</strong>{' '}
          {dayjs(selectedSale.createdAt).format('DD/MM/YYYY HH:mm')}
        </p>
        {selectedSale.payment && selectedSale.payment.length > 0 && (
          <p>
            <strong>Thanh toán:</strong> {selectedSale.payment[0].amount}₫{' '}
            <Tag
              color={getPaymentStatusColor(
                Number(selectedSale.payment[0].status)
              )}
            >
              {getPaymentStatusText(Number(selectedSale.payment[0].status))}
            </Tag>
          </p>
        )}
      </div>
    </Modal>
  );
}
