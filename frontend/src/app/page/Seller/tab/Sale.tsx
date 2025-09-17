"use client"
import type React from "react"
import { useState } from "react"
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
} from "antd"
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
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"

const { Content } = Layout
const { Title, Text } = Typography
const { RangePicker } = DatePicker

interface Sale {
  key: string
  id: string
  orderNumber: string
  customer: string
  customerEmail: string
  products: string[]
  quantity: number
  totalAmount: number
  status: "Hoàn Thành" | "Đang Chờ" | "Hủy" | "Hoàn Tiền"
  paymentMethod: "Thẻ Tín Dụng" | "PayPal" | "Chuyển Khoản Ngân Hàng" | "Tiền Mặt"
  saleDate: string
  notes?: string
}

// Mock data for sales
const mockSales: Sale[] = [
  {
    key: "1",
    id: "SAL001",
    orderNumber: "ORD-2025-001",
    customer: "Nguyễn Văn An",
    customerEmail: "an.nguyen@email.com",
    products: ["Áo thun Nike", "Giày Adidas"],
    quantity: 3,
    totalAmount: 3000000,
    status: "Hoàn Thành",
    paymentMethod: "Thẻ Tín Dụng",
    saleDate: "2025-01-15",
    notes: "Yêu cầu giao hàng nhanh",
  },
  {
    key: "2",
    id: "SAL002",
    orderNumber: "ORD-2025-002",
    customer: "Trần Thị Bình",
    customerEmail: "binh.tran@email.com",
    products: ["Quần Jeans", "Áo sơ mi cotton"],
    quantity: 2,
    totalAmount: 2000000,
    status: "Đang Chờ",
    paymentMethod: "PayPal",
    saleDate: "2025-01-14",
  },
  {
    key: "3",
    id: "SAL003",
    orderNumber: "ORD-2025-003",
    customer: "Lê Văn Cường",
    customerEmail: "cuong.le@email.com",
    products: ["Giày New Balance 327"],
    quantity: 1,
    totalAmount: 1200000,
    status: "Hoàn Thành",
    paymentMethod: "Thẻ Tín Dụng",
    saleDate: "2025-01-13",
  },
  {
    key: "4",
    id: "SAL004",
    orderNumber: "ORD-2025-004",
    customer: "Phạm Thị Duyên",
    customerEmail: "duyen.pham@email.com",
    products: ["Váy mùa hè", "Sandal"],
    quantity: 2,
    totalAmount: 1700000,
    status: "Hủy",
    paymentMethod: "Chuyển Khoản Ngân Hàng",
    saleDate: "2025-01-12",
    notes: "Khách hàng yêu cầu hủy",
  },
]

export default function Sale() {
  const [sales, setSales] = useState<Sale[]>(mockSales)
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingSale, setEditingSale] = useState<Sale | null>(null)
  const [searchText, setSearchText] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [paymentFilter, setPaymentFilter] = useState<string>("all")
  const [form] = Form.useForm()

  // Filter sales based on search and filters
  const filteredSales = sales.filter((sale) => {
    const matchesSearch =
      sale.customer.toLowerCase().includes(searchText.toLowerCase()) ||
      sale.orderNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      sale.customerEmail.toLowerCase().includes(searchText.toLowerCase())
    const matchesStatus = statusFilter === "all" || sale.status === statusFilter
    const matchesPayment = paymentFilter === "all" || sale.paymentMethod === paymentFilter

    return matchesSearch && matchesStatus && matchesPayment
  })

  // Calculate statistics
  const totalSales = sales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const completedSales = sales.filter((sale) => sale.status === "Hoàn Thành").length
  const pendingSales = sales.filter((sale) => sale.status === "Đang Chờ").length
  const totalOrders = sales.length

  const handleAddSale = () => {
    setEditingSale(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEditSale = (sale: Sale) => {
    setEditingSale(sale)
    form.setFieldsValue({
      ...sale,
      saleDate: dayjs(sale.saleDate),
      products: sale.products,
    })
    setIsModalVisible(true)
  }

  const handleDeleteSale = (saleId: string) => {
    Modal.confirm({
      title: "Xóa Đơn Hàng",
      content: "Bạn có chắc chắn muốn xóa đơn hàng này?",
      okText: "Xóa",
      okType: "danger",
      onOk: () => {
        setSales(sales.filter((sale) => sale.id !== saleId))
        message.success("Xóa đơn hàng thành công")
      },
    })
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      if (editingSale) {
        // Update existing sale
        setSales(
          sales.map((sale) =>
            sale.id === editingSale.id
              ? {
                  ...sale,
                  ...values,
                  saleDate: values.saleDate.format("YYYY-MM-DD"),
                }
              : sale,
          ),
        )
        message.success("Cập nhật đơn hàng thành công")
      } else {
        // Add new sale
        const newSale: Sale = {
          ...values,
          key: `${sales.length + 1}`,
          id: `SAL${String(sales.length + 1).padStart(3, "0")}`,
          orderNumber: `ORD-2025-${String(sales.length + 1).padStart(3, "0")}`,
          saleDate: values.saleDate.format("YYYY-MM-DD"),
        }
        setSales([...sales, newSale])
        message.success("Tạo đơn hàng thành công")
      }

      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error("Không thể lưu đơn hàng")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hoàn Thành":
        return "green"
      case "Đang Chờ":
        return "orange"
      case "Hủy":
        return "red"
      case "Hoàn Tiền":
        return "purple"
      default:
        return "default"
    }
  }

  const columns: ColumnsType<Sale> = [
    {
      title: "Mã Đơn Hàng",
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (text: string, record: Sale) => (
        <div>
          <div className="font-medium text-gray-900">{text}</div>
          <div className="text-sm text-gray-500">{record.id}</div>
        </div>
      ),
      sorter: (a, b) => a.orderNumber.localeCompare(b.orderNumber),
    },
    {
      title: "Khách Hàng",
      dataIndex: "customer",
      key: "customer",
      render: (text: string, record: Sale) => (
        <div>
          <div className="font-medium text-gray-900">{text}</div>
          <div className="text-sm text-gray-500">{record.customerEmail}</div>
        </div>
      ),
      sorter: (a, b) => a.customer.localeCompare(b.customer),
    },
    {
      title: "Sản Phẩm",
      dataIndex: "products",
      key: "products",
      render: (products: string[]) => (
        <div className="max-w-xs">
          {products.slice(0, 2).map((product, index) => (
            <Tag key={index} className="mb-1">
              {product}
            </Tag>
          ))}
          {products.length > 2 && <Tag className="mb-1">+{products.length - 2} sản phẩm</Tag>}
        </div>
      ),
    },
    {
      title: "Số Lượng",
      dataIndex: "quantity",
      key: "quantity",
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: "Tổng Tiền",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) => <span className="font-medium text-gray-900">₫{amount.toLocaleString('vi-VN')}</span>,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="border-0">
          {status}
        </Tag>
      ),
      filters: [
        { text: "Hoàn Thành", value: "Hoàn Thành" },
        { text: "Đang Chờ", value: "Đang Chờ" },
        { text: "Hủy", value: "Hủy" },
        { text: "Hoàn Tiền", value: "Hoàn Tiền" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Thanh Toán",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method: string) => <span className="text-gray-600">{method}</span>,
    },
    {
      title: "Ngày Bán",
      dataIndex: "saleDate",
      key: "saleDate",
      render: (date: string) => dayjs(date).format("DD MMM, YYYY"),
      sorter: (a, b) => dayjs(a.saleDate).unix() - dayjs(b.saleDate).unix(),
    },
    {
      title: "Hành Động",
      key: "actions",
      render: (_, record: Sale) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                icon: <EyeOutlined />,
                label: "Xem Chi Tiết",
              },
              {
                key: "edit",
                icon: <EditOutlined />,
                label: "Chỉnh Sửa Đơn Hàng",
                onClick: () => handleEditSale(record),
              },
              {
                type: "divider",
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: "Xóa",
                danger: true,
                onClick: () => handleDeleteSale(record.id),
              },
            ],
          }}
          trigger={["click"]}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys)
    },
  }

  return (
    <Layout>
      <Content className="p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Title level={2} className="!mb-1 !text-gray-900">
              Quản Lý Bán Hàng
            </Title>
            <Text className="text-gray-500">Theo dõi và quản lý tất cả giao dịch bán hàng của bạn</Text>
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
                precision={0}
                prefix={<DollarOutlined className="text-cyan-500" />}
                suffix="₫"
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
                title="Đang Chờ"
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
              <Select placeholder="Trạng Thái" style={{ width: 120 }} value={statusFilter} onChange={setStatusFilter}>
                <Select.Option value="all">Tất Cả Trạng Thái</Select.Option>
                <Select.Option value="Hoàn Thành">Hoàn Thành</Select.Option>
                <Select.Option value="Đang Chờ">Đang Chờ</Select.Option>
                <Select.Option value="Hủy">Hủy</Select.Option>
                <Select.Option value="Hoàn Tiền">Hoàn Tiền</Select.Option>
              </Select>
              <Select
                placeholder="Phương Thức Thanh Toán"
                style={{ width: 140 }}
                value={paymentFilter}
                onChange={setPaymentFilter}
              >
                <Select.Option value="all">Tất Cả Thanh Toán</Select.Option>
                <Select.Option value="Thẻ Tín Dụng">Thẻ Tín Dụng</Select.Option>
                <Select.Option value="PayPal">PayPal</Select.Option>
                <Select.Option value="Chuyển Khoản Ngân Hàng">Chuyển Khoản Ngân Hàng</Select.Option>
                <Select.Option value="Tiền Mặt">Tiền Mặt</Select.Option>
              </Select>
              <RangePicker />
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
                <Text className="text-gray-600">Đã chọn {selectedRowKeys.length}</Text>
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
              showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng số ${total} đơn hàng`,
            }}
            scroll={{ x: 1200 }}
            className="custom-table"
          />
        </Card>

        {/* Add/Edit Sale Modal */}
        <Modal
          title={editingSale ? "Chỉnh Sửa Đơn Hàng" : "Thêm Đơn Hàng Mới"}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => setIsModalVisible(false)}
          width={800}
          okText={editingSale ? "Cập Nhật Đơn Hàng" : "Thêm Đơn Hàng"}
          okButtonProps={{ className: "bg-cyan-500 border-cyan-500" }}
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="customer"
                  label="Tên Khách Hàng"
                  rules={[{ required: true, message: "Vui lòng nhập tên khách hàng" }]}
                >
                  <Input placeholder="Nhập tên khách hàng" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="customerEmail"
                  label="Email Khách Hàng"
                  rules={[
                    { required: true, message: "Vui lòng nhập email khách hàng" },
                    { type: "email", message: "Vui lòng nhập email hợp lệ" },
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
                  rules={[{ required: true, message: "Vui lòng chọn sản phẩm" }]}
                >
                  <Select mode="tags" placeholder="Chọn hoặc thêm sản phẩm" className="w-full" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="quantity"
                  label="Tổng Số Lượng"
                  rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
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
                  rules={[{ required: true, message: "Vui lòng nhập tổng tiền" }]}
                >
                  <InputNumber min={0} step={1000} placeholder="0" className="w-full" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="Trạng Thái" rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}>
                  <Select placeholder="Chọn trạng thái">
                    <Select.Option value="Hoàn Thành">Hoàn Thành</Select.Option>
                    <Select.Option value="Đang Chờ">Đang Chờ</Select.Option>
                    <Select.Option value="Hủy">Hủy</Select.Option>
                    <Select.Option value="Hoàn Tiền">Hoàn Tiền</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="paymentMethod"
                  label="Phương Thức Thanh Toán"
                  rules={[{ required: true, message: "Vui lòng chọn phương thức thanh toán" }]}
                >
                  <Select placeholder="Chọn phương thức thanh toán">
                    <Select.Option value="Thẻ Tín Dụng">Thẻ Tín Dụng</Select.Option>
                    <Select.Option value="PayPal">PayPal</Select.Option>
                    <Select.Option value="Chuyển Khoản Ngân Hàng">Chuyển Khoản Ngân Hàng</Select.Option>
                    <Select.Option value="Tiền Mặt">Tiền Mặt</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="saleDate"
                  label="Ngày Bán"
                  rules={[{ required: true, message: "Vui lòng chọn ngày bán" }]}
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
      </Content>
    </Layout>
  )
}