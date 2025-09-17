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
  Tag,
  Dropdown,
  Statistic,
  Row,
  Col,
  message,
  Avatar,
  DatePicker,
} from "antd"
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  UserOutlined,
  ShoppingOutlined,
  DollarOutlined,
  StarOutlined,
  ExportOutlined,
  PhoneOutlined,
  MailOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"

const { Content } = Layout
const { Title, Text } = Typography

interface Customer {
  key: string
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  totalOrders: number
  totalSpent: number
  status: "Hoạt Động" | "Không Hoạt Động" | "VIP"
  joinDate: string
  lastOrderDate?: string
  avatar?: string
  notes?: string
}

// Mock data for customers
const mockCustomers: Customer[] = [
  {
    key: "1",
    id: "CUS001",
    name: "Nguyễn Văn An",
    email: "an.nguyen@email.com",
    phone: "+84 912 345 678",
    address: "123 Đường Láng",
    city: "Hà Nội",
    country: "Việt Nam",
    totalOrders: 15,
    totalSpent: 28767250,
    status: "VIP",
    joinDate: "2024-03-15",
    lastOrderDate: "2025-01-10",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    key: "2",
    id: "CUS002",
    name: "Trần Thị Bình",
    email: "binh.tran@email.com",
    phone: "+84 923 456 789",
    address: "456 Nguyễn Trãi",
    city: "TP.HCM",
    country: "Việt Nam",
    totalOrders: 8,
    totalSpent: 14955750,
    status: "Hoạt Động",
    joinDate: "2024-06-20",
    lastOrderDate: "2025-01-08",
  },
  {
    key: "3",
    id: "CUS003",
    name: "Lê Văn Cường",
    email: "cuong.le@email.com",
    phone: "+84 934 567 890",
    address: "789 Lê Lợi",
    city: "Đà Nẵng",
    country: "Việt Nam",
    totalOrders: 3,
    totalSpent: 4141500,
    status: "Hoạt Động",
    joinDate: "2024-09-10",
    lastOrderDate: "2024-12-15",
  },
  {
    key: "4",
    id: "CUS004",
    name: "Phạm Thị Duyên",
    email: "duyen.pham@email.com",
    phone: "+84 945 678 901",
    address: "321 Trần Phú",
    city: "Hải Phòng",
    country: "Việt Nam",
    totalOrders: 0,
    totalSpent: 0,
    status: "Không Hoạt Động",
    joinDate: "2024-11-05",
    notes: "Đã đăng ký nhưng chưa mua hàng",
  },
  {
    key: "5",
    id: "CUS005",
    name: "Hoàng Minh Đức",
    email: "duc.hoang@email.com",
    phone: "+84 956 789 012",
    address: "654 Đường Huỳnh Tấn Phát",
    city: "Cần Thơ",
    country: "Việt Nam",
    totalOrders: 22,
    totalSpent: 48300000,
    status: "VIP",
    joinDate: "2024-01-20",
    lastOrderDate: "2025-01-12",
  },
]

export default function Customer() {
  const [customers, setCustomers] = useState<Customer[]>(mockCustomers)
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [searchText, setSearchText] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [countryFilter, setCountryFilter] = useState<string>("all")
  const [form] = Form.useForm()

  // Filter customers based on search and filters
  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchText.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchText.toLowerCase()) ||
      customer.phone.includes(searchText) ||
      customer.id.toLowerCase().includes(searchText.toLowerCase())
    const matchesStatus = statusFilter === "all" || customer.status === statusFilter
    const matchesCountry = countryFilter === "all" || customer.country === countryFilter

    return matchesSearch && matchesStatus && matchesCountry
  })

  // Calculate statistics
  const totalCustomers = customers.length
  const activeCustomers = customers.filter((c) => c.status === "Hoạt Động").length
  const vipCustomers = customers.filter((c) => c.status === "VIP").length
  const totalRevenue = customers.reduce((sum, customer) => sum + customer.totalSpent, 0)

  const handleAddCustomer = () => {
    setEditingCustomer(null)
    form.resetFields()
    setIsModalVisible(true)
  }

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    form.setFieldsValue({
      ...customer,
      joinDate: dayjs(customer.joinDate),
      lastOrderDate: customer.lastOrderDate ? dayjs(customer.lastOrderDate) : null,
    })
    setIsModalVisible(true)
  }

  const handleDeleteCustomer = (customerId: string) => {
    Modal.confirm({
      title: "Xóa Khách Hàng",
      content: "Bạn có chắc chắn muốn xóa khách hàng này? Hành động này không thể hoàn tác.",
      okText: "Xóa",
      okType: "danger",
      onOk: () => {
        setCustomers(customers.filter((customer) => customer.id !== customerId))
        message.success("Xóa khách hàng thành công")
      },
    })
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      if (editingCustomer) {
        // Update existing customer
        setCustomers(
          customers.map((customer) =>
            customer.id === editingCustomer.id
              ? {
                  ...customer,
                  ...values,
                  joinDate: values.joinDate.format("YYYY-MM-DD"),
                  lastOrderDate: values.lastOrderDate ? values.lastOrderDate.format("YYYY-MM-DD") : undefined,
                }
              : customer,
          ),
        )
        message.success("Cập nhật khách hàng thành công")
      } else {
        // Add new customer
        const newCustomer: Customer = {
          ...values,
          key: `${customers.length + 1}`,
          id: `CUS${String(customers.length + 1).padStart(3, "0")}`,
          totalOrders: 0,
          totalSpent: 0,
          joinDate: values.joinDate.format("YYYY-MM-DD"),
          lastOrderDate: values.lastOrderDate ? values.lastOrderDate.format("YYYY-MM-DD") : undefined,
        }
        setCustomers([...customers, newCustomer])
        message.success("Thêm khách hàng thành công")
      }

      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error("Không thể lưu thông tin khách hàng")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hoạt Động":
        return "green"
      case "VIP":
        return "gold"
      case "Không Hoạt Động":
        return "red"
      default:
        return "default"
    }
  }

  const columns: ColumnsType<Customer> = [
    {
      title: "Khách Hàng",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Customer) => (
        <div className="flex items-center gap-3">
          <Avatar src={record.avatar} icon={<UserOutlined />} size={40} className="border border-gray-200" />
          <div>
            <div className="font-medium text-gray-900">{text}</div>
            <div className="text-sm text-gray-500">{record.id}</div>
          </div>
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: "Liên Hệ",
      key: "contact",
      render: (_, record: Customer) => (
        <div>
          <div className="flex items-center gap-1 mb-1">
            <MailOutlined className="text-gray-400 text-xs" />
            <span className="text-sm text-gray-900">{record.email}</span>
          </div>
          <div className="flex items-center gap-1">
            <PhoneOutlined className="text-gray-400 text-xs" />
            <span className="text-sm text-gray-500">{record.phone}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Vị Trí",
      key: "location",
      render: (_, record: Customer) => (
        <div>
          <div className="text-sm text-gray-900">{record.city}</div>
          <div className="text-sm text-gray-500">{record.country}</div>
        </div>
      ),
    },
    {
      title: "Đơn Hàng",
      dataIndex: "totalOrders",
      key: "totalOrders",
      render: (orders: number) => <span className="font-medium text-gray-900">{orders}</span>,
      sorter: (a, b) => a.totalOrders - b.totalOrders,
    },
    {
      title: "Tổng Chi Tiêu",
      dataIndex: "totalSpent",
      key: "totalSpent",
      render: (amount: number) => <span className="font-medium text-gray-900">₫{amount.toLocaleString('vi-VN')}</span>,
      sorter: (a, b) => a.totalSpent - b.totalSpent,
    },
    {
      title: "Trạng Thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="border-0" icon={status === "VIP" ? <StarOutlined /> : undefined}>
          {status}
        </Tag>
      ),
      filters: [
        { text: "Hoạt Động", value: "Hoạt Động" },
        { text: "VIP", value: "VIP" },
        { text: "Không Hoạt Động", value: "Không Hoạt Động" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Ngày Tham Gia",
      dataIndex: "joinDate",
      key: "joinDate",
      render: (date: string) => dayjs(date).format("DD MMM, YYYY"),
      sorter: (a, b) => dayjs(a.joinDate).unix() - dayjs(b.joinDate).unix(),
    },
    {
      title: "Đơn Hàng Gần Nhất",
      dataIndex: "lastOrderDate",
      key: "lastOrderDate",
      render: (date?: string) =>
        date ? dayjs(date).format("DD MMM, YYYY") : <span className="text-gray-400">Chưa có</span>,
      sorter: (a, b) => {
        if (!a.lastOrderDate && !b.lastOrderDate) return 0
        if (!a.lastOrderDate) return 1
        if (!b.lastOrderDate) return -1
        return dayjs(a.lastOrderDate).unix() - dayjs(b.lastOrderDate).unix()
      },
    },
    {
      title: "Hành Động",
      key: "actions",
      render: (_, record: Customer) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                icon: <EyeOutlined />,
                label: "Xem Hồ Sơ",
              },
              {
                key: "edit",
                icon: <EditOutlined />,
                label: "Chỉnh Sửa Khách Hàng",
                onClick: () => handleEditCustomer(record),
              },
              {
                key: "orders",
                icon: <ShoppingOutlined />,
                label: "Xem Đơn Hàng",
              },
              {
                type: "divider",
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: "Xóa",
                danger: true,
                onClick: () => handleDeleteCustomer(record.id),
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
              Quản Lý Khách Hàng
            </Title>
            <Text className="text-gray-500">Quản lý cơ sở dữ liệu và mối quan hệ với khách hàng</Text>
          </div>
          <Space>
            <Button icon={<ExportOutlined />}>Xuất Dữ Liệu</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-cyan-500 border-cyan-500"
              onClick={handleAddCustomer}
            >
              Thêm Khách Hàng
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-cyan-500">
              <Statistic
                title="Tổng Khách Hàng"
                value={totalCustomers}
                prefix={<UserOutlined className="text-cyan-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Khách Hàng Hoạt Động"
                value={activeCustomers}
                prefix={<UserOutlined className="text-green-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-yellow-500">
              <Statistic
                title="Khách Hàng VIP"
                value={vipCustomers}
                prefix={<StarOutlined className="text-yellow-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-purple-500">
              <Statistic
                title="Tổng Doanh Thu"
                value={totalRevenue}
                precision={0}
                prefix={<DollarOutlined className="text-purple-500" />}
                suffix="₫"
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
                <Select.Option value="Hoạt Động">Hoạt Động</Select.Option>
                <Select.Option value="VIP">VIP</Select.Option>
                <Select.Option value="Không Hoạt Động">Không Hoạt Động</Select.Option>
              </Select>
              <Select placeholder="Quốc Gia" style={{ width: 120 }} value={countryFilter} onChange={setCountryFilter}>
                <Select.Option value="all">Tất Cả Quốc Gia</Select.Option>
                <Select.Option value="Việt Nam">Việt Nam</Select.Option>
                <Select.Option value="Nhật Bản">Nhật Bản</Select.Option>
                <Select.Option value="Hàn Quốc">Hàn Quốc</Select.Option>
              </Select>
            </Space>
            <Input
              placeholder="Tìm kiếm khách hàng..."
              prefix={<SearchOutlined className="text-gray-400" />}
              className="max-w-md"
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {selectedRowKeys.length > 0 && (
              <Space>
                <Text className="text-gray-600">Đã chọn {selectedRowKeys.length}</Text>
                <Button size="small">Gửi Email Hàng Loạt</Button>
                <Button size="small" danger>
                  Xóa Hàng Loạt
                </Button>
              </Space>
            )}
          </div>
        </Card>

        {/* Customers Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredCustomers}
            rowSelection={rowSelection}
            loading={loading}
            pagination={{
              total: filteredCustomers.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng số ${total} khách hàng`,
            }}
            scroll={{ x: 1200 }}
            className="custom-table"
          />
        </Card>

        {/* Add/Edit Customer Modal */}
        <Modal
          title={editingCustomer ? "Chỉnh Sửa Khách Hàng" : "Thêm Khách Hàng Mới"}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => setIsModalVisible(false)}
          width={800}
          okText={editingCustomer ? "Cập Nhật Khách Hàng" : "Thêm Khách Hàng"}
          okButtonProps={{ className: "bg-cyan-500 border-cyan-500" }}
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Họ và Tên"
                  rules={[{ required: true, message: "Vui lòng nhập họ và tên khách hàng" }]}
                >
                  <Input placeholder="Nhập họ và tên" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Địa Chỉ Email"
                  rules={[
                    { required: true, message: "Vui lòng nhập địa chỉ email" },
                    { type: "email", message: "Vui lòng nhập email hợp lệ" },
                  ]}
                >
                  <Input placeholder="Nhập địa chỉ email" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="Số Điện Thoại"
                  rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
                >
                  <Input placeholder="Nhập số điện thoại" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="Trạng Thái" rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}>
                  <Select placeholder="Chọn trạng thái">
                    <Select.Option value="Hoạt Động">Hoạt Động</Select.Option>
                    <Select.Option value="VIP">VIP</Select.Option>
                    <Select.Option value="Không Hoạt Động">Không Hoạt Động</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="address" label="Địa Chỉ" rules={[{ required: true, message: "Vui lòng nhập địa chỉ" }]}>
                  <Input placeholder="Nhập địa chỉ đường phố" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="city" label="Thành Phố" rules={[{ required: true, message: "Vui lòng nhập thành phố" }]}>
                  <Input placeholder="Nhập thành phố" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="country"
                  label="Quốc Gia"
                  rules={[{ required: true, message: "Vui lòng chọn quốc gia" }]}
                >
                  <Select placeholder="Chọn quốc gia">
                    <Select.Option value="Việt Nam">Việt Nam</Select.Option>
                    <Select.Option value="Nhật Bản">Nhật Bản</Select.Option>
                    <Select.Option value="Hàn Quốc">Hàn Quốc</Select.Option>
                    <Select.Option value="Trung Quốc">Trung Quốc</Select.Option>
                    <Select.Option value="Thái Lan">Thái Lan</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="joinDate"
                  label="Ngày Tham Gia"
                  rules={[{ required: true, message: "Vui lòng chọn ngày tham gia" }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="lastOrderDate" label="Ngày Đặt Hàng Gần Nhất">
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="notes" label="Ghi Chú">
              <Input.TextArea rows={3} placeholder="Nhập ghi chú bổ sung về khách hàng" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  )
}