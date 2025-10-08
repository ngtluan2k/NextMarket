// OrderDetailModal.tsx (compact + Confirm/Cancel, auto-token, AntD v5)
import React, { useState } from 'react';
import {
  Modal,
  Button,
  Tag,
  Table,
  Typography,
  Descriptions,
  Divider,
  Space,
  Row,
  Col,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { orderService } from '../../../service/order.service';

const { Title, Text } = Typography;

/* ================== Types ================== */
export interface ProductItem {
  id: number;
  quantity: number;
  subtotal: string;
  product: {
    id: number; name: string; base_price: string; brand_id: number; description: string;
    short_description: string; slug: string; status: string; store_id: number;
    updated_at: string; created_at: string; uuid: string;
  };
  variant?: {
    id: number; sku: string; price: string; stock: number; variant_name: string; barcode: string;
    created_at?: string; updated_at?: string; uuid: string;
  };
  discount: string;
  price: string;
  uuid: string;
}
export interface Payment {
  id: number; amount: string; createdAt: string; paidAt?: string | null;
  provider?: string | null; rawPayload?: string | null; status: string;
  transactionId?: string | null; uuid: string;
}
export interface Sale {
  id: number;
  orderNumber: string;
  orderItem: ProductItem[];
  totalAmount: string;
  subtotal: string;
  discountTotal: string;
  shippingFee: string;
  status: string; // "0" | "1" | ...
  createdAt: string;
  updatedAt: string;
  currency: string;
  user: {
    id: number; username: string; email: string; password: string;
    status: string; code: string | null; uuid: string; created_at: string; updated_at?: string | null;
  };
  userAddress?: {
    id: number; recipientName: string; phone: string; country: string; province: string;
    district: string | null; ward: string; street: string; postalCode: string | null;
    isDefault: boolean; createdAt?: string | null; uuid: string; user_id: number;
  };
  payment?: Payment[];
  paymentMethod?: string;
  notes?: string;
}

/* ================== Status maps ================== */
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
const orderStatusStringMap: Record<number, string> = {
  0: 'pending', 1: 'confirmed', 2: 'processing', 3: 'shipped',
  4: 'delivered', 5: 'completed', 6: 'cancelled', 7: 'returned',
};
const getStatusText = (s: number | string) => orderStatusMap[Number(s)] || 'Không Xác Định';
const getStatusColor = (s: number | string) => {
  switch (Number(s)) {
    case 0: return 'orange';
    case 1: return 'blue';
    case 2: return 'cyan';
    case 3: return 'purple';
    case 4:
    case 5: return 'green';
    case 6: return 'red';
    case 7: return 'magenta';
    default: return 'default';
  }
};
const getPaymentStatusText = (s: number | string) => {
  switch (Number(s)) {
    case 0: return 'Chưa thanh toán';
    case 1: return 'Đã thanh toán';
    case 2: return 'Thất bại';
    case 3: return 'Hoàn tiền';
    default: return 'Không rõ';
  }
};
const getPaymentStatusColor = (s: number | string) => {
  switch (Number(s)) {
    case 0: return 'orange';
    case 1: return 'green';
    case 2: return 'red';
    case 3: return 'purple';
    default: return 'default';
  }
};
function formatVND(n: string | number) {
  const v = typeof n === 'string' ? parseFloat(n) : n;
  if (Number.isNaN(v)) return '₫0';
  return v.toLocaleString('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
}
function fmtDiscount(n: number) {
  const abs = Math.abs(n);
  if (abs < 1e-9) return formatVND(0);
  return `-${formatVND(abs)}`;
}

/* ================== Props ================== */
type Props = {
  sale: Sale | null;
  open?: boolean;
  onClose: () => void;
  onStatusChange?: (newStatus: number) => void;
};

/* ================== Table Columns ================== */
const itemColumns: ColumnsType<ProductItem> = [
  { title: 'Sản phẩm', key: 'product', render: (_, item) => (
      <div>
        <div className="font-medium text-gray-900">{item.product?.name}</div>
        <div className="text-xs text-gray-500">#{item.product?.id}</div>
      </div>
    ),
  },
  { title: 'SKU / Biến thể', key: 'variant', render: (_, item) => <span>{item.variant?.sku || '—'}</span> },
  { title: 'Đơn giá', dataIndex: 'price', key: 'price', align: 'right', render: (v: string) => formatVND(v) },
  { title: 'SL', dataIndex: 'quantity', key: 'quantity', width: 70, align: 'right' },
  { title: 'Tạm tính', key: 'subtotal', align: 'right',
    render: (_, item) => <span className="font-medium">{formatVND((parseFloat(item.price||'0')) * (item.quantity||0))}</span> },
];

/* ================== Component ================== */
const OrderDetailModal: React.FC<Props> = ({ sale, open, onClose, onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const isOpen = typeof open === 'boolean' ? open : !!sale;
  if (!sale) return null;

  const payment = sale.payment?.[0];
  const totals = {
    subtotal: parseFloat(sale.subtotal || '0'),
    discount: parseFloat(sale.discountTotal || '0'),
    shipping: parseFloat(sale.shippingFee || '0'),
    grand: parseFloat(sale.totalAmount || '0'),
  };

  // Lấy token tự động từ localStorage
  const getToken = () =>
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    '';

  // Gọi service + xử lý fallback và log
  const doChangeStatus = async (newStatus: number, note: string) => {
    const token = getToken();
    if (!token) {
      message.error('Thiếu token xác thực');
      return;
    }
    try {
      setLoading(true);
      const statusStr = orderStatusStringMap[newStatus];
      await orderService.changeStatus(sale.id, statusStr, token, note);
      message.success('Cập nhật trạng thái thành công');
      onStatusChange?.(newStatus);
      onClose();
    } catch (e: any) {
      // log rõ ràng để bắt đúng bệnh
      console.error('Lỗi cập nhật trạng thái:', {
        status: e?.response?.status,
        data: e?.response?.data,
        message: e?.message,
      });
      message.error(e?.response?.data?.message || e?.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Xác nhận trước khi gửi
  const handleChangeStatus = (newStatus: number, note: string) => {
    const title =
      newStatus === 1 ? 'Xác nhận đơn hàng?' :
      newStatus === 6 ? 'Hủy đơn hàng?' :
      'Cập nhật trạng thái?';
    Modal.confirm({
      title,
      content: note,
      okText: 'Đồng ý',
      cancelText: 'Huỷ',
      onOk: () => doChangeStatus(newStatus, note),
    });
  };

  const renderFooter = () => {
    const status = Number(sale.status);
    const buttons: React.ReactNode[] = [];

    if (status === 0) {
      buttons.push(
        <Button key="confirm" type="primary" loading={loading}
          onClick={() => handleChangeStatus(1, 'Người bán xác nhận')}>
          Xác Nhận Đơn
        </Button>,
        <Button key="cancel" danger loading={loading}
          onClick={() => handleChangeStatus(6, 'Người bán hủy đơn')}>
          Hủy Đơn
        </Button>,
      );
    } else if (status === 1 || status === 2) {
      buttons.push(
        <Button key="cancel" danger loading={loading}
          onClick={() => handleChangeStatus(6, 'Người bán hủy đơn')}>
          Hủy Đơn
        </Button>,
      );
    } else if (status === 3) {
      buttons.push(
        <Button key="complete" type="primary" loading={loading}
          onClick={() => handleChangeStatus(5, 'Đơn đã hoàn thành')}>
          Hoàn Thành
        </Button>,
      );
    }

    buttons.push(<Button key="close" onClick={onClose}>Đóng</Button>);
    return buttons;
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      width={840}
      title={
        <div className="flex items-center justify-between gap-2" style={{ paddingRight: 24 }}>
          <span>
            Chi tiết đơn hàng:&nbsp;<b>{sale.orderNumber}</b>&nbsp;
            <Text type="secondary">#{sale.id}</Text>
          </span>
          <Space size={6}>
            <Tag color={getStatusColor(sale.status)}>{getStatusText(sale.status)}</Tag>
            <Tag color={getPaymentStatusColor(payment?.status ?? '0')}>
              {getPaymentStatusText(payment?.status ?? '0')}
            </Tag>
          </Space>
        </div>
      }
      footer={renderFooter()}
      destroyOnClose
      styles={{ body: { padding: 14 } }}   // AntD v5: thay cho bodyStyle
      style={{ top: 24 }}
      confirmLoading={loading}
    >
      <div className="space-y-4">
        {/* Info blocks */}
        <Row gutter={[8, 8]}>
          <Col xs={24} md={12}>
            <Title level={5} style={{ margin: 0, marginBottom: 6 }}>
              Khách hàng
            </Title>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Tên">{sale.user?.username || '—'}</Descriptions.Item>
              <Descriptions.Item label="Email">{sale.user?.email || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">{new Date(sale.createdAt).toLocaleString('vi-VN')}</Descriptions.Item>
              <Descriptions.Item label="Cập nhật">{new Date(sale.updatedAt).toLocaleString('vi-VN')}</Descriptions.Item>
            </Descriptions>
          </Col>

          <Col xs={24} md={12}>
            <Title level={5} style={{ margin: 0, marginBottom: 6 }}>
              Địa chỉ giao hàng
            </Title>
            {sale.userAddress ? (
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="Người nhận">{sale.userAddress.recipientName}</Descriptions.Item>
                <Descriptions.Item label="SĐT">{sale.userAddress.phone}</Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">
                  {`${sale.userAddress.street}, ${sale.userAddress.ward}, ${sale.userAddress.district || ''}`
                    .replace(/, ,/g, ',')
                    .replace(/ ,/g, ',')}
                </Descriptions.Item>
                <Descriptions.Item label="Tỉnh/TP - Quốc gia">
                  {sale.userAddress.province}, {sale.userAddress.country}{' '}
                  {sale.userAddress.postalCode ? `(${sale.userAddress.postalCode})` : ''}
                </Descriptions.Item>
              </Descriptions>
            ) : (
              <Text type="secondary">Không có địa chỉ giao hàng</Text>
            )}
          </Col>
        </Row>

        <Divider style={{ margin: '8px 0' }} />

        {/* Items + totals */}
        <Row gutter={[8, 8]}>
          <Col xs={24} md={15}>
            <Title level={5} style={{ margin: 0, marginBottom: 6 }}>
              Sản phẩm
            </Title>
            <Table<ProductItem>
              rowKey={(r) => r.uuid || String(r.id)}
              dataSource={sale.orderItem || []}
              columns={itemColumns}
              pagination={false}
              size="small"
            />
          </Col>

          <Col xs={24} md={9}>
            <Title level={5} style={{ margin: 0, marginBottom: 6, display: 'flex', justifyContent: 'flex-end' }}>
              Tổng kết
            </Title>
            <div style={{ textAlign: 'right' }}>
              <div><Text type="secondary">Tạm tính:&nbsp;</Text><Text strong>{formatVND(totals.subtotal)}</Text></div>
              <div><Text type="secondary">Giảm giá:&nbsp;</Text><Text strong>{fmtDiscount(totals.discount)}</Text></div>
              <div><Text type="secondary">Phí vận chuyển:&nbsp;</Text><Text strong>{formatVND(totals.shipping)}</Text></div>
              <Divider style={{ margin: '8px 0' }} />
              <div><Text>Thành tiền:&nbsp;</Text><Text strong className="text-gray-900">{formatVND(totals.grand)}</Text></div>
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '8px 0' }} />

        {/* Payment & notes */}
        <Row gutter={[8, 8]}>
          <Col xs={24} md={12}>
            <Title level={5} style={{ margin: 0, marginBottom: 6 }}>
              Thanh toán
            </Title>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label="Phương thức">{sale.paymentMethod || '—'}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={getPaymentStatusColor(payment?.status ?? '0')}>
                  {getPaymentStatusText(payment?.status ?? '0')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Mã giao dịch">{payment?.transactionId || '—'}</Descriptions.Item>
              <Descriptions.Item label="Nhà cung cấp">{payment?.provider || '—'}</Descriptions.Item>
              <Descriptions.Item label="Ngày tạo TT">{payment ? new Date(payment.createdAt).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
            </Descriptions>
          </Col>

          <Col xs={24} md={12}>
            <Title level={5} style={{ margin: 0, marginBottom: 6 }}>
              Ghi chú
            </Title>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: sale.notes?.trim()
                  ? sale.notes.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>')
                  : '<span style="color:#999">Không có ghi chú</span>',
              }}
            />
          </Col>
        </Row>
      </div>
    </Modal>
  );
};

export default OrderDetailModal;
