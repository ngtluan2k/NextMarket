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
  status: "Active" | "Inactive" | "VIP"
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
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street",
    city: "New York",
    country: "USA",
    totalOrders: 15,
    totalSpent: 1250.75,
    status: "VIP",
    joinDate: "2024-03-15",
    lastOrderDate: "2025-01-10",
    avatar: "/placeholder.svg?height=40&width=40",
  },
  {
    key: "2",
    id: "CUS002",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1 (555) 234-5678",
    address: "456 Oak Avenue",
    city: "Los Angeles",
    country: "USA",
    totalOrders: 8,
    totalSpent: 650.25,
    status: "Active",
    joinDate: "2024-06-20",
    lastOrderDate: "2025-01-08",
  },
  {
    key: "3",
    id: "CUS003",
    name: "Mike Wilson",
    email: "mike.w@email.com",
    phone: "+1 (555) 345-6789",
    address: "789 Pine Road",
    city: "Chicago",
    country: "USA",
    totalOrders: 3,
    totalSpent: 180.5,
    status: "Active",
    joinDate: "2024-09-10",
    lastOrderDate: "2024-12-15",
  },
  {
    key: "4",
    id: "CUS004",
    name: "Emma Davis",
    email: "emma.d@email.com",
    phone: "+1 (555) 456-7890",
    address: "321 Elm Street",
    city: "Miami",
    country: "USA",
    totalOrders: 0,
    totalSpent: 0,
    status: "Inactive",
    joinDate: "2024-11-05",
    notes: "Registered but never made a purchase",
  },
  {
    key: "5",
    id: "CUS005",
    name: "David Brown",
    email: "david.b@email.com",
    phone: "+1 (555) 567-8901",
    address: "654 Maple Drive",
    city: "Seattle",
    country: "USA",
    totalOrders: 22,
    totalSpent: 2100.0,
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
  const activeCustomers = customers.filter((c) => c.status === "Active").length
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
      title: "Delete Customer",
      content: "Are you sure you want to delete this customer? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        setCustomers(customers.filter((customer) => customer.id !== customerId))
        message.success("Customer deleted successfully")
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
        message.success("Customer updated successfully")
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
        message.success("Customer created successfully")
      }

      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error("Failed to save customer")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "green"
      case "VIP":
        return "gold"
      case "Inactive":
        return "red"
      default:
        return "default"
    }
  }

  const columns: ColumnsType<Customer> = [
    {
      title: "Customer",
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
      title: "Contact",
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
      title: "Location",
      key: "location",
      render: (_, record: Customer) => (
        <div>
          <div className="text-sm text-gray-900">{record.city}</div>
          <div className="text-sm text-gray-500">{record.country}</div>
        </div>
      ),
    },
    {
      title: "Orders",
      dataIndex: "totalOrders",
      key: "totalOrders",
      render: (orders: number) => <span className="font-medium text-gray-900">{orders}</span>,
      sorter: (a, b) => a.totalOrders - b.totalOrders,
    },
    {
      title: "Total Spent",
      dataIndex: "totalSpent",
      key: "totalSpent",
      render: (amount: number) => <span className="font-medium text-gray-900">€{amount.toFixed(2)}</span>,
      sorter: (a, b) => a.totalSpent - b.totalSpent,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="border-0" icon={status === "VIP" ? <StarOutlined /> : undefined}>
          {status}
        </Tag>
      ),
      filters: [
        { text: "Active", value: "Active" },
        { text: "VIP", value: "VIP" },
        { text: "Inactive", value: "Inactive" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Join Date",
      dataIndex: "joinDate",
      key: "joinDate",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
      sorter: (a, b) => dayjs(a.joinDate).unix() - dayjs(b.joinDate).unix(),
    },
    {
      title: "Last Order",
      dataIndex: "lastOrderDate",
      key: "lastOrderDate",
      render: (date?: string) =>
        date ? dayjs(date).format("MMM DD, YYYY") : <span className="text-gray-400">Never</span>,
      sorter: (a, b) => {
        if (!a.lastOrderDate && !b.lastOrderDate) return 0
        if (!a.lastOrderDate) return 1
        if (!b.lastOrderDate) return -1
        return dayjs(a.lastOrderDate).unix() - dayjs(b.lastOrderDate).unix()
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: Customer) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                icon: <EyeOutlined />,
                label: "View Profile",
              },
              {
                key: "edit",
                icon: <EditOutlined />,
                label: "Edit Customer",
                onClick: () => handleEditCustomer(record),
              },
              {
                key: "orders",
                icon: <ShoppingOutlined />,
                label: "View Orders",
              },
              {
                type: "divider",
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: "Delete",
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
              Customer Management
            </Title>
            <Text className="text-gray-500">Manage your customer database and relationships</Text>
          </div>
          <Space>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-cyan-500 border-cyan-500"
              onClick={handleAddCustomer}
            >
              Add Customer
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-cyan-500">
              <Statistic
                title="Total Customers"
                value={totalCustomers}
                prefix={<UserOutlined className="text-cyan-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Active Customers"
                value={activeCustomers}
                prefix={<UserOutlined className="text-green-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-yellow-500">
              <Statistic
                title="VIP Customers"
                value={vipCustomers}
                prefix={<StarOutlined className="text-yellow-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-purple-500">
              <Statistic
                title="Total Revenue"
                value={totalRevenue}
                precision={2}
                prefix={<DollarOutlined className="text-purple-500" />}
                suffix="€"
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Space wrap>
              <Select placeholder="Status" style={{ width: 120 }} value={statusFilter} onChange={setStatusFilter}>
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="Active">Active</Select.Option>
                <Select.Option value="VIP">VIP</Select.Option>
                <Select.Option value="Inactive">Inactive</Select.Option>
              </Select>
              <Select placeholder="Country" style={{ width: 120 }} value={countryFilter} onChange={setCountryFilter}>
                <Select.Option value="all">All Countries</Select.Option>
                <Select.Option value="USA">USA</Select.Option>
                <Select.Option value="Canada">Canada</Select.Option>
                <Select.Option value="UK">UK</Select.Option>
              </Select>
            </Space>
            <Input
              placeholder="Search customers..."
              prefix={<SearchOutlined className="text-gray-400" />}
              className="max-w-md"
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {selectedRowKeys.length > 0 && (
              <Space>
                <Text className="text-gray-600">{selectedRowKeys.length} selected</Text>
                <Button size="small">Bulk Email</Button>
                <Button size="small" danger>
                  Bulk Delete
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
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} customers`,
            }}
            scroll={{ x: 1200 }}
            className="custom-table"
          />
        </Card>

        {/* Add/Edit Customer Modal */}
        <Modal
          title={editingCustomer ? "Edit Customer" : "Add New Customer"}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => setIsModalVisible(false)}
          width={800}
          okText={editingCustomer ? "Update Customer" : "Add Customer"}
          okButtonProps={{ className: "bg-cyan-500 border-cyan-500" }}
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="name"
                  label="Full Name"
                  rules={[{ required: true, message: "Please enter customer name" }]}
                >
                  <Input placeholder="Enter full name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: "Please enter email address" },
                    { type: "email", message: "Please enter valid email" },
                  ]}
                >
                  <Input placeholder="Enter email address" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="phone"
                  label="Phone Number"
                  rules={[{ required: true, message: "Please enter phone number" }]}
                >
                  <Input placeholder="Enter phone number" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="Status" rules={[{ required: true, message: "Please select status" }]}>
                  <Select placeholder="Select status">
                    <Select.Option value="Active">Active</Select.Option>
                    <Select.Option value="VIP">VIP</Select.Option>
                    <Select.Option value="Inactive">Inactive</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="address" label="Address" rules={[{ required: true, message: "Please enter address" }]}>
                  <Input placeholder="Enter street address" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="city" label="City" rules={[{ required: true, message: "Please enter city" }]}>
                  <Input placeholder="Enter city" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="country"
                  label="Country"
                  rules={[{ required: true, message: "Please select country" }]}
                >
                  <Select placeholder="Select country">
                    <Select.Option value="USA">United States</Select.Option>
                    <Select.Option value="Canada">Canada</Select.Option>
                    <Select.Option value="UK">United Kingdom</Select.Option>
                    <Select.Option value="Germany">Germany</Select.Option>
                    <Select.Option value="France">France</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="joinDate"
                  label="Join Date"
                  rules={[{ required: true, message: "Please select join date" }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="lastOrderDate" label="Last Order Date">
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={3} placeholder="Enter any additional notes about the customer" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  )
}
