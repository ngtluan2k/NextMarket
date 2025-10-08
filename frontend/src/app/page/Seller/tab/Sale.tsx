import type React from 'react';
import { useState, useEffect } from 'react';
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
import OrderDetailModal from './OrderDetailModal';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useMyStoreOrders } from '../../../hooks/useStoreOrders';
import { storeService } from '../../../../service/store.service';
import 'dayjs/locale/vi';
import type { Sale, ProductItem, Payment} from '../../../types/order';

dayjs.locale('vi');
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const { Content } = Layout;
const { Title, Text } = Typography;
const { RangePicker } = DatePicker;



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

function getStatusText(status: number | string): string {
  return orderStatusMap[Number(status)] || 'Không Xác Định';
}

export default function Sale() {
  const token = localStorage.getItem('token') || '';
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(
    null
  );
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [storeId, setStoreId] = useState<number | null>(null);
  const [form] = Form.useForm();
  
  const {
    sales,
    loading,
    error,
    pagination,
    fetchSales,
    handleTableChange,
    createOrder,
    updateOrder,
    deleteOrder,
    changeOrderStatus,
  } = useMyStoreOrders({
    status: statusFilter,
    startDate: dateRange ? dateRange[0].format('YYYY-MM-DD') : undefined,
    endDate: dateRange ? dateRange[1].format('YYYY-MM-DD') : undefined,
  });

  // Lấy storeId khi component mount
  useEffect(() => {
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

  const handleViewDetail = (sale: Sale) => {
    setSelectedSale(sale);
    setIsDetailModalVisible(true);
  };

  const handleAddSale = () => {
    setEditingSale(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale);
    form.setFieldsValue({
      customer: sale.userAddress?.recipientName || sale.user.username,
      customerEmail: sale.user.email,
      products: sale.orderItem.map((item) => item.product.name),
      quantity: sale.orderItem.reduce((sum, item) => sum + item.quantity, 0),
      totalAmount: parseFloat(sale.totalAmount),
      status: sale.status,
      paymentMethod: sale.paymentMethod,
      saleDate: dayjs(sale.createdAt),
      notes: sale.notes,
    });
    setIsModalVisible(true);
  };

  const handleDeleteSale = (saleId: number) => {
    Modal.confirm({
      title: 'Xóa Đơn Hàng',
      content: 'Bạn có chắc chắn muốn xóa đơn hàng này?',
      okText: 'Xóa',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteOrder(saleId);
          message.success('Xóa đơn hàng thành công');
        } catch (err: any) {
          message.error(err.message || 'Không thể xóa đơn hàng');
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const orderData: Partial<Sale> = {
        user: {
          id: 0, // Cần API để lấy user_id thực tế
          username: values.customer,
          email: values.customerEmail,
          password: '',
          status: 'active',
          code: null,
          uuid: '',
          created_at: new Date().toISOString(),
        },
        orderItem: values.products.map((name: string, index: number) => ({
          id: index + 1,
          quantity: Math.floor(values.quantity / values.products.length),
          subtotal: (values.totalAmount / values.products.length).toString(),
          product: {
            id: index + 1, // Cần API để lấy product_id thực tế
            name,
            base_price: '0',
            brand_id: 0,
            description: '',
            short_description: '',
            slug: '',
            status: 'active',
            store_id: storeId || 0,
            updated_at: '',
            created_at: '',
            uuid: '',
          },
          discount: '0',
          price: '0',
          uuid: '',
        })),
        totalAmount: values.totalAmount.toString(),
        subtotal: values.totalAmount.toString(),
        discountTotal: '0',
        shippingFee: '0',
        status: values.status,
        paymentMethod: values.paymentMethod,
        createdAt: values.saleDate.format('YYYY-MM-DD'),
        updatedAt: values.saleDate.format('YYYY-MM-DD'),
        currency: 'VND',
        notes: values.notes,
      };

      if (editingSale) {
        await updateOrder(editingSale.id, orderData);
        message.success('Cập nhật đơn hàng thành công');
      } else {
        await createOrder(orderData);
        message.success('Tạo đơn hàng thành công');
      }

      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Không thể lưu đơn hàng');
    }
  };

  // Filter sales locally for searchText and paymentFilter
  const filteredSales = sales.filter((sale) => {
    const customerName =
      sale.userAddress?.recipientName || sale.user?.username || '';
    const matchesSearch =
      customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      sale.orderNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      sale.user?.email?.toLowerCase().includes(searchText.toLowerCase());

    const matchesPayment =
      paymentFilter === 'all' ||
      (sale.payment &&
        sale.payment[0] &&
        sale.payment[0].status === paymentFilter);

    return matchesSearch && matchesPayment;
  });

  // Calculate statistics
  const totalSales = sales.reduce(
    (sum, sale) => sum + Number(sale.totalAmount || 0),
    0
  );
  const completedSales = sales.filter((sale) => sale.status === '5').length;
  const pendingSales = sales.filter((sale) => sale.status === '0').length;
  const totalOrders = sales.length;

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
      sorter: (a, b) => a.id - b.id,
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
                onClick: () => handleViewDetail(record),
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
                onClick: () => handleDeleteSale(record.id),
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

        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-cyan-500">
              <Statistic
                title="Tổng Doanh Thu"
                value={totalSales}
                precision={0}
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

        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Space wrap>
              <Select
                placeholder="Trạng Thái"
                style={{ width: 120 }}
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                }}
              >
                <Select.Option value="all">Tất Cả Trạng Thái</Select.Option>
                {Object.entries(orderStatusMap).map(([key, value]) => (
                  <Select.Option key={key} value={key}>
                    {value}
                  </Select.Option>
                ))}
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
                onChange={(dates) => {
                  setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null);
                }}
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

        <Card>
          <Table
            columns={columns}
            dataSource={sales}  
            rowSelection={rowSelection}
            loading={loading}
            pagination={{
              ...pagination,  
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} trên tổng số ${total} đơn hàng`,
            }}
            onChange={handleTableChange}  
            scroll={{ x: 1200 }}
            className="custom-table"
            onRow={(record) => ({
              onClick: () => handleViewDetail(record),
              style: { cursor: 'pointer' },
            })}
          />
        </Card>

        <Modal
          title={editingSale ? 'Chỉnh Sửa Đơn Hàng' : 'Thêm Đơn Hàng Mới'}
          open={isModalVisible}
          onOk={handleModalOk}
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
                    {Object.entries(orderStatusMap).map(([key, value]) => (
                      <Select.Option key={key} value={key}>
                        {value}
                      </Select.Option>
                    ))}
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
          selectedSale={selectedSale}
          isDetailModalVisible={isDetailModalVisible}
          setIsDetailModalVisible={setIsDetailModalVisible}
          token={token}
          onStatusChange={(newStatus, note) => {
            if (storeId && selectedSale) {
              changeOrderStatus(
                storeId,
                selectedSale.id,
                String(newStatus),
                note
              );
               fetchSales();
            }
          }}
        />
      </Content>
    </Layout>
  );
}