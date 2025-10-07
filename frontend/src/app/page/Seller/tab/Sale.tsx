'use client';
import type React from 'react';
import { useState } from 'react';
import {
  Layout,
  Card,
  Table,
  Typography,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Tag,
  Dropdown,
  Statistic,
  Row,
  Col,
  message,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  CalendarOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useMyStoreOrders } from '../../../hooks/useStoreOrders';
import 'dayjs/locale/vi'; // import locale
import OrderDetailModal, { Sale as SaleType } from '../../../components/seller/OrderDetailModal';
dayjs.locale('vi'); // set global locale
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface ProductItem {
  id: number;
  quantity: number;
  subtotal: string;
  product: {
    id: number;
    name: string;
    base_price: string;
    brand_id: number;
    description: string;
    short_description: string;
    slug: string;
    status: string;
    store_id: number;
    updated_at: string;
    created_at: string;
    uuid: string;
  };
  variant?: {
    id: number;
    sku: string;
    price: string;
    stock: number;
    variant_name: string;
    barcode: string;
    created_at?: string;
    updated_at?: string;
    uuid: string;
  };
  discount: string;
  price: string;
  uuid: string;
}
interface Payment {
  id: number;
  amount: string;
  createdAt: string;
  paidAt?: string | null;
  provider?: string | null;
  rawPayload?: string | null;
  status: string; // '0', '1', '2', '3'
  transactionId?: string | null;
  uuid: string;
}

interface Sale {
  id: number;
  orderNumber: string; // nếu API không có, bạn có thể tự sinh dạng ORD-xxx
  orderItem: ProductItem[];
  totalAmount: string;
  subtotal: string;
  discountTotal: string;
  shippingFee: string;
  status: string; // '0', '1', ... hoặc map sang 'Hoàn Thành', 'Đang Chờ'...
  createdAt: string;
  updatedAt: string;
  currency: string;
  user: {
    id: number;
    username: string;
    email: string;
    password: string;
    status: string;
    code: string | null;
    uuid: string;
    created_at: string;
    updated_at?: string | null;
  };
  userAddress?: {
    id: number;
    recipientName: string;
    phone: string;
    country: string;
    province: string;
    district: string | null;
    ward: string;
    street: string;
    postalCode: string | null;
    isDefault: boolean;
    createdAt?: string | null;
    uuid: string;
    user_id: number;
  };
  payment?: Payment[];
  paymentMethod?: string;
  notes?: string;
}

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

// Hoặc hàm
function getStatusText(status: number | string): string {
  return orderStatusMap[Number(status)] || 'Không Xác Định';
}

export default function Sale() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );

  const [detailSale, setDetailSale] = useState<SaleType | null>(null);

  const [form] = Form.useForm();
  const generateOrderNumber = (id: number) =>
    `ORD-${String(id).padStart(3, '0')}`;
  const { sales, loading, error } = useMyStoreOrders();
  console.log('Sales from API:', sales);

  const safeLower = (val?: string) => (val || '').toLowerCase();

  // Filter sales based on search and filters
  const filteredSales = sales.filter((sale) => {
    const customerName =
      sale.user?.userAddress?.recipientName || sale.user?.username || '';
    const matchesSearch =
      customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      sale.id.toString().includes(searchText.toLowerCase()) ||
      sale.user?.email?.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || sale.status === statusFilter;
    const matchesPayment =
      paymentFilter === 'all' ||
      (sale.payment &&
        sale.payment[0] &&
        sale.payment[0].status === paymentFilter);

    const matchesDate =
      !dateRange ||
      (dayjs(sale.createdAt).isSameOrAfter(dateRange[0], 'day') &&
        dayjs(sale.createdAt).isSameOrBefore(dateRange[1], 'day'));
    return matchesDate && matchesSearch && matchesStatus && matchesPayment;
  });

  // Calculate statistics
  const totalSales = sales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount || 0),
    0
  );
  const completedSales = sales.filter(
    (sale) => sale.status === '5'
  ).length;
  const pendingSales = sales.filter((sale) => sale.status === '0').length;
  const totalOrders = sales.length;

  const handleAddSale = () => {
    setEditingSale(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    form.setFieldsValue({
      ...sale,
      saleDate: dayjs(sale.createdAt),
      products: sale.orderItem,
    });
    setIsModalVisible(true);
  };

  // const handleDeleteSale = (saleId: string) => {
  //   Modal.confirm({
  //     title: "Xóa Đơn Hàng",
  //     content: "Bạn có chắc chắn muốn xóa đơn hàng này?",
  //     okText: "Xóa",
  //     okType: "danger",
  //     onOk: () => {
  //       setSales(sales.filter((sale) => sale.id !== saleId))
  //       message.success("Xóa đơn hàng thành công")
  //     },
  //   })
  // }

  // const handleModalOk = async () => {
  //   try {
  //     const values = await form.validateFields()

  //     if (editingSale) {
  //       // Update existing sale
  //       setSales(
  //         sales.map((sale) =>
  //           sale.id === editingSale.id
  //             ? {
  //                 ...sale,
  //                 ...values,
  //                 saleDate: values.saleDate.format("YYYY-MM-DD"),
  //               }
  //             : sale,
  //         ),
  //       )
  //       message.success("Cập nhật đơn hàng thành công")
  //     } else {
  //       // Add new sale
  //       const newSale: Sale = {
  //         ...values,
  //         key: `${sales.length + 1}`,
  //         id: `SAL${String(sales.length + 1).padStart(3, "0")}`,
  //         orderNumber: `ORD-2025-${String(sales.length + 1).padStart(3, "0")}`,
  //         saleDate: values.saleDate.format("YYYY-MM-DD"),
  //       }
  //       setSales([...sales, newSale])
  //       message.success("Tạo đơn hàng thành công")
  //     }

  //     setIsModalVisible(false)
  //     form.resetFields()
  //   } catch (error) {
  //     message.error("Không thể lưu đơn hàng")
  //   }
  // }

  const columns: ColumnsType<Sale> = [
    {
      title: 'Mã Đơn Hàng',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record: Sale) => (
        <div>
          <div className="font-medium text-gray-900">{text}</div>
          <div className="text-sm text-gray-500">{record.id}</div>
        </div>
      ),
      sorter: (a, b) => {
        const numA = a.id;
        const numB = b.id;
        return numA - numB;
      },
    },
    {
      title: 'Khách Hàng',
      dataIndex: 'user',
      key: 'customer',
      render: (user) => (
        <div>
          <div className="font-medium text-gray-900">
            {user.userAddress?.recipientName || user.username}
          </div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      ),
      sorter: (a, b) => a.user.username.localeCompare(b.user.username),
    },
    {
      title: 'Sản Phẩm',
      dataIndex: 'orderItem',
      key: 'products',
      render: (items: ProductItem[]) => (
        <div className="max-w-xs">
          {(Array.isArray(items) ? items : [])
            .slice(0, 2)
            .map((item, index) => (
              <Tag key={index} className="mb-1">
                {item.product?.name}
                {item.variant ? ` (${item.variant.variant_name})` : ''}
              </Tag>
            ))}
          {Array.isArray(items) && items.length > 2 && (
            <Tag className="mb-1">+{items.length - 2} sản phẩm</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Số Lượng',
      dataIndex: 'orderItem',
      key: 'quantity',
      sorter: (a, b) =>
        (Array.isArray(a.orderItem) ? a.orderItem : []).reduce(
          (sum, item) => sum + item.quantity,
          0
        ) -
        (Array.isArray(b.orderItem) ? b.orderItem : []).reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
      render: (orderItem: ProductItem[]) =>
        (Array.isArray(orderItem) ? orderItem : []).reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
    },
    {
      title: 'Tổng Tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: string) => (
        <span className="font-medium text-gray-900">
          ₫{parseFloat(amount).toLocaleString('vi-VN')}
        </span>
      ),
      sorter: (a, b) => parseFloat(a.totalAmount) - parseFloat(b.totalAmount),
    },

    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: number | string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      ),
      filters: Object.entries(orderStatusMap).map(([key, value]) => ({
        text: value,
        value: key,
      })),
      onFilter: (value, record) => Number(record.status) === Number(value),
    },
    {
      title: 'Trạng Thái Thanh Toán',
      dataIndex: 'payment',
      key: 'paymentStatus',
      render: (payments: Payment[] | undefined) => {
        const payment = payments?.[0];
        if (!payment) return <Tag>Chưa Thanh Toán</Tag>;
        const statusNum = Number(payment.status);
        return (
          <Tag color={getPaymentStatusColor(statusNum)}>
            {getPaymentStatusText(statusNum)}
          </Tag>
        );
      },
    },

    {
      title: 'Ngày Bán',
      dataIndex: 'createdAt',
      key: 'saleDate',
      render: (date: string) => dayjs(date).format('DD MMM, YYYY'),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: 'Hành Động',
      key: 'actions',
      render: (_, record: Sale) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'Xem Chi Tiết',
                onClick: () => setDetailSale(record),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Chỉnh Sửa Đơn Hàng',
                onClick: () => handleEditSale(record),
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Xóa',
                danger: true,
                // onClick: () => handleDeleteSale(record.id),
              },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <Layout>
      <Content className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Title level={2} className="!mb-1 !text-gray-900">
              Quản Lý Bán Hàng
            </Title>
            <Text className="text-gray-500">
              Theo dõi và quản lý tất cả giao dịch bán hàng của bạn
            </Text>
          </div>
          <Space>
            <Button icon={<ExportOutlined />}>Xuất Dữ Liệu</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-cyan-500 border-cyan-500"
              onClick={handleAddSale}
            >
              Thêm Đơn Hàng
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-cyan-500">
              <Statistic
                title="Tổng Doanh Thu"
                value={totalSales}
                precision={0} // số nguyên
                prefix={<DollarOutlined className="text-cyan-500" />}
                suffix="₫"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Tổng Đơn Hàng"
                value={totalOrders}
                prefix={<ShoppingCartOutlined className="text-green-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-blue-500">
              <Statistic
                title="Hoàn Thành"
                value={completedSales}
                prefix={<RiseOutlined className="text-blue-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-orange-500">
              <Statistic
                title="Đang Chờ Xác Nhận"
                value={pendingSales}
                prefix={<CalendarOutlined className="text-orange-500" />}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Space wrap>
              <Select
                placeholder="Trạng Thái"
                style={{ width: 120 }}
                value={statusFilter}
                onChange={setStatusFilter}
              >
                <Select.Option value="all">Tất Cả Trạng Thái</Select.Option>
                <Select.Option value="0">Đang Chờ Xác Nhận</Select.Option>
                <Select.Option value="1">Đã Xác Nhận</Select.Option>
                <Select.Option value="2">Đang Xử Lí</Select.Option>
                <Select.Option value="3">Đã Giao Hàng</Select.Option>
                <Select.Option value="4">Shipper Đã Giao</Select.Option>
                <Select.Option value="5">Hoàn Thành</Select.Option>
                <Select.Option value="6">Đã Hủy</Select.Option>
                <Select.Option value="7">Trả Hàng</Select.Option>
              </Select>
              <Select
                placeholder="Phương Thức Thanh Toán"
                style={{ width: 140 }}
                value={paymentFilter}
                onChange={setPaymentFilter}
              >
                <Select.Option value="all">Tất Cả Thanh Toán</Select.Option>
                <Select.Option value="0">Chưa thanh toán</Select.Option>
                <Select.Option value="1">Đã thanh toán</Select.Option>
                <Select.Option value="2">Thất bại</Select.Option>
                <Select.Option value="3">Hoàn tiền</Select.Option>
              </Select>
              <RangePicker
                value={dateRange as any}
                onChange={(dates) =>
                  setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)
                }
              />
            </Space>
            <Input
              placeholder="Tìm kiếm đơn hàng, khách hàng..."
              prefix={<SearchOutlined className="text-gray-400" />}
              className="max-w-md"
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {selectedRowKeys.length > 0 && (
              <Space>
                <Text className="text-gray-600">
                  Đã chọn {selectedRowKeys.length}
                </Text>
                <Button size="small">Xuất Hàng Loạt</Button>
                <Button size="small" danger>
                  Xóa Hàng Loạt
                </Button>
              </Space>
            )}
          </div>
        </Card>

        {/* Sales Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredSales}
            rowSelection={rowSelection}
            loading={loading}
            pagination={{
              total: filteredSales.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} trên tổng số ${total} đơn hàng`,
            }}
            scroll={{ x: 1200 }}
            className="custom-table"
          />
        </Card>

        {/* Add/Edit Sale Modal */}
        <Modal
          title={editingSale ? 'Chỉnh Sửa Đơn Hàng' : 'Thêm Đơn Hàng Mới'}
          open={isModalVisible}
          // onOk={handleModalOk}
          onCancel={() => setIsModalVisible(false)}
          width={800}
          okText={editingSale ? 'Cập Nhật Đơn Hàng' : 'Thêm Đơn Hàng'}
          okButtonProps={{ className: 'bg-cyan-500 border-cyan-500' }}
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="customer"
                  label="Tên Khách Hàng"
                  rules={[
                    { required: true, message: 'Vui lòng nhập tên khách hàng' },
                  ]}
                >
                  <Input placeholder="Nhập tên khách hàng" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="customerEmail"
                  label="Email Khách Hàng"
                  rules={[
                    {
                      required: true,
                      message: 'Vui lòng nhập email khách hàng',
                    },
                    { type: 'email', message: 'Vui lòng nhập email hợp lệ' },
                  ]}
                >
                  <Input placeholder="Nhập email khách hàng" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="products"
                  label="Sản Phẩm"
                  rules={[
                    { required: true, message: 'Vui lòng chọn sản phẩm' },
                  ]}
                >
                  <Select
                    mode="tags"
                    placeholder="Chọn hoặc thêm sản phẩm"
                    className="w-full"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="quantity"
                  label="Tổng Số Lượng"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số lượng' },
                  ]}
                >
                  <InputNumber min={1} placeholder="0" className="w-full" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="totalAmount"
                  label="Tổng Tiền (₫)"
                  rules={[
                    { required: true, message: 'Vui lòng nhập tổng tiền' },
                  ]}
                >
                  <InputNumber
                    min={0}
                    step={1000}
                    placeholder="0"
                    className="w-full"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="status"
                  label="Trạng Thái"
                  rules={[
                    { required: true, message: 'Vui lòng chọn trạng thái' },
                  ]}
                >
                  <Select placeholder="Chọn trạng thái">
                    <Select.Option value="0">Đang Chờ Xác Nhận</Select.Option>
                    <Select.Option value="1">Đã Xác Nhận</Select.Option>
                    <Select.Option value="2">Đang Xử Lí</Select.Option>
                    <Select.Option value="3">Đã Giao Hàng</Select.Option>
                    <Select.Option value="4">Shipper Đã Giao</Select.Option>
                    <Select.Option value="5">Hoàn Thành</Select.Option>
                    <Select.Option value="6">Đã Hủy</Select.Option>
                    <Select.Option value="7">Trả Hàng</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="paymentMethod"
                  label="Phương Thức Thanh Toán"
                  rules={[
                    {
                      required: true,
                      message: 'Vui lòng chọn phương thức thanh toán',
                    },
                  ]}
                >
                  <Select placeholder="Chọn phương thức thanh toán">
                    <Select.Option value="Thẻ Tín Dụng">
                      Thẻ Tín Dụng
                    </Select.Option>
                    <Select.Option value="PayPal">PayPal</Select.Option>
                    <Select.Option value="Chuyển Khoản Ngân Hàng">
                      Chuyển Khoản Ngân Hàng
                    </Select.Option>
                    <Select.Option value="Tiền Mặt">Tiền Mặt</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="saleDate"
                  label="Ngày Bán"
                  rules={[
                    { required: true, message: 'Vui lòng chọn ngày bán' },
                  ]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="notes" label="Ghi Chú">
              <Input.TextArea rows={3} placeholder="Nhập ghi chú bổ sung" />
            </Form.Item>
          </Form>
        </Modal>
        <OrderDetailModal
            sale={detailSale}
            onClose={() => setDetailSale(null)}
            onEdit={(s) => {
              // Mở form edit của bạn (nếu có)
              setDetailSale(null);
              // openEditModal(s);
            }}
          />
      </Content>
    </Layout>
  );
}
