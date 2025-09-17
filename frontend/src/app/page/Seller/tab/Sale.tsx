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
  RiseOutlined ,
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
  status: "Completed" | "Pending" | "Cancelled" | "Refunded"
  paymentMethod: "Credit Card" | "PayPal" | "Bank Transfer" | "Cash"
  saleDate: string
  notes?: string
}

// Mock data for sales
const mockSales: Sale[] = [
  {
    key: "1",
    id: "SAL001",
    orderNumber: "ORD-2025-001",
    customer: "John Smith",
    customerEmail: "john.smith@email.com",
    products: ["Nike T-shirt", "Adidas Sneakers"],
    quantity: 3,
    totalAmount: 129.99,
    status: "Completed",
    paymentMethod: "Credit Card",
    saleDate: "2025-01-15",
    notes: "Express delivery requested",
  },
  {
    key: "2",
    id: "SAL002",
    orderNumber: "ORD-2025-002",
    customer: "Sarah Johnson",
    customerEmail: "sarah.j@email.com",
    products: ["Mom Jeans", "Cotton Blouse"],
    quantity: 2,
    totalAmount: 89.5,
    status: "Pending",
    paymentMethod: "PayPal",
    saleDate: "2025-01-14",
  },
  {
    key: "3",
    id: "SAL003",
    orderNumber: "ORD-2025-003",
    customer: "Mike Wilson",
    customerEmail: "mike.w@email.com",
    products: ["New Balance 327"],
    quantity: 1,
    totalAmount: 51.9,
    status: "Completed",
    paymentMethod: "Credit Card",
    saleDate: "2025-01-13",
  },
  {
    key: "4",
    id: "SAL004",
    orderNumber: "ORD-2025-004",
    customer: "Emma Davis",
    customerEmail: "emma.d@email.com",
    products: ["Summer Dress", "Sandals"],
    quantity: 2,
    totalAmount: 75.0,
    status: "Cancelled",
    paymentMethod: "Bank Transfer",
    saleDate: "2025-01-12",
    notes: "Customer requested cancellation",
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
  const completedSales = sales.filter((sale) => sale.status === "Completed").length
  const pendingSales = sales.filter((sale) => sale.status === "Pending").length
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
      title: "Delete Sale",
      content: "Are you sure you want to delete this sale record?",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        setSales(sales.filter((sale) => sale.id !== saleId))
        message.success("Sale deleted successfully")
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
        message.success("Sale updated successfully")
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
        message.success("Sale created successfully")
      }

      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error("Failed to save sale")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "green"
      case "Pending":
        return "orange"
      case "Cancelled":
        return "red"
      case "Refunded":
        return "purple"
      default:
        return "default"
    }
  }

  const columns: ColumnsType<Sale> = [
    {
      title: "Order #",
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
      title: "Customer",
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
      title: "Products",
      dataIndex: "products",
      key: "products",
      render: (products: string[]) => (
        <div className="max-w-xs">
          {products.slice(0, 2).map((product, index) => (
            <Tag key={index} className="mb-1">
              {product}
            </Tag>
          ))}
          {products.length > 2 && <Tag className="mb-1">+{products.length - 2} more</Tag>}
        </div>
      ),
    },
    {
      title: "Quantity",
      dataIndex: "quantity",
      key: "quantity",
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) => <span className="font-medium text-gray-900">€{amount.toFixed(2)}</span>,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="border-0">
          {status}
        </Tag>
      ),
      filters: [
        { text: "Completed", value: "Completed" },
        { text: "Pending", value: "Pending" },
        { text: "Cancelled", value: "Cancelled" },
        { text: "Refunded", value: "Refunded" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Payment",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method: string) => <span className="text-gray-600">{method}</span>,
    },
    {
      title: "Date",
      dataIndex: "saleDate",
      key: "saleDate",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
      sorter: (a, b) => dayjs(a.saleDate).unix() - dayjs(b.saleDate).unix(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: Sale) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                icon: <EyeOutlined />,
                label: "View Details",
              },
              {
                key: "edit",
                icon: <EditOutlined />,
                label: "Edit Sale",
                onClick: () => handleEditSale(record),
              },
              {
                type: "divider",
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: "Delete",
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
              Sales Management
            </Title>
            <Text className="text-gray-500">Track and manage all your sales transactions</Text>
          </div>
          <Space>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-cyan-500 border-cyan-500"
              onClick={handleAddSale}
            >
              Add Sale
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-cyan-500">
              <Statistic
                title="Total Sales"
                value={totalSales}
                precision={2}
                prefix={<DollarOutlined className="text-cyan-500" />}
                suffix="€"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Total Orders"
                value={totalOrders}
                prefix={<ShoppingCartOutlined className="text-green-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-blue-500">
              <Statistic
                title="Completed"
                value={completedSales}
                prefix={<RiseOutlined className="text-blue-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-orange-500">
              <Statistic
                title="Pending"
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
              <Select placeholder="Status" style={{ width: 120 }} value={statusFilter} onChange={setStatusFilter}>
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="Completed">Completed</Select.Option>
                <Select.Option value="Pending">Pending</Select.Option>
                <Select.Option value="Cancelled">Cancelled</Select.Option>
                <Select.Option value="Refunded">Refunded</Select.Option>
              </Select>
              <Select
                placeholder="Payment Method"
                style={{ width: 140 }}
                value={paymentFilter}
                onChange={setPaymentFilter}
              >
                <Select.Option value="all">All Payments</Select.Option>
                <Select.Option value="Credit Card">Credit Card</Select.Option>
                <Select.Option value="PayPal">PayPal</Select.Option>
                <Select.Option value="Bank Transfer">Bank Transfer</Select.Option>
                <Select.Option value="Cash">Cash</Select.Option>
              </Select>
              <RangePicker />
            </Space>
            <Input
              placeholder="Search orders, customers..."
              prefix={<SearchOutlined className="text-gray-400" />}
              className="max-w-md"
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {selectedRowKeys.length > 0 && (
              <Space>
                <Text className="text-gray-600">{selectedRowKeys.length} selected</Text>
                <Button size="small">Bulk Export</Button>
                <Button size="small" danger>
                  Bulk Delete
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
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} sales`,
            }}
            scroll={{ x: 1200 }}
            className="custom-table"
          />
        </Card>

        {/* Add/Edit Sale Modal */}
        <Modal
          title={editingSale ? "Edit Sale" : "Add New Sale"}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => setIsModalVisible(false)}
          width={800}
          okText={editingSale ? "Update Sale" : "Add Sale"}
          okButtonProps={{ className: "bg-cyan-500 border-cyan-500" }}
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="customer"
                  label="Customer Name"
                  rules={[{ required: true, message: "Please enter customer name" }]}
                >
                  <Input placeholder="Enter customer name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="customerEmail"
                  label="Customer Email"
                  rules={[
                    { required: true, message: "Please enter customer email" },
                    { type: "email", message: "Please enter valid email" },
                  ]}
                >
                  <Input placeholder="Enter customer email" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="products"
                  label="Products"
                  rules={[{ required: true, message: "Please select products" }]}
                >
                  <Select mode="tags" placeholder="Select or add products" className="w-full" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="quantity"
                  label="Total Quantity"
                  rules={[{ required: true, message: "Please enter quantity" }]}
                >
                  <InputNumber min={1} placeholder="0" className="w-full" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="totalAmount"
                  label="Total Amount (€)"
                  rules={[{ required: true, message: "Please enter total amount" }]}
                >
                  <InputNumber min={0} step={0.01} placeholder="0.00" className="w-full" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="status" label="Status" rules={[{ required: true, message: "Please select status" }]}>
                  <Select placeholder="Select status">
                    <Select.Option value="Completed">Completed</Select.Option>
                    <Select.Option value="Pending">Pending</Select.Option>
                    <Select.Option value="Cancelled">Cancelled</Select.Option>
                    <Select.Option value="Refunded">Refunded</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="paymentMethod"
                  label="Payment Method"
                  rules={[{ required: true, message: "Please select payment method" }]}
                >
                  <Select placeholder="Select payment method">
                    <Select.Option value="Credit Card">Credit Card</Select.Option>
                    <Select.Option value="PayPal">PayPal</Select.Option>
                    <Select.Option value="Bank Transfer">Bank Transfer</Select.Option>
                    <Select.Option value="Cash">Cash</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="saleDate"
                  label="Sale Date"
                  rules={[{ required: true, message: "Please select sale date" }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="notes" label="Notes">
              <Input.TextArea rows={3} placeholder="Enter any additional notes" />
            </Form.Item>
          </Form>
        </Modal>
      </Content>
    </Layout>
  )
}
