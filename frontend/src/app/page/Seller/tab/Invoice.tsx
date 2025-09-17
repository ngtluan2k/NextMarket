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
  DatePicker,
  InputNumber,
  Divider,
} from "antd"
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  FileTextOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExportOutlined,
  PrinterOutlined,
  SendOutlined,
  MinusCircleOutlined,
} from "@ant-design/icons"
import type { ColumnsType } from "antd/es/table"
import dayjs from "dayjs"

const { Content } = Layout
const { Title, Text } = Typography

interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

interface Invoice {
  key: string
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerAddress: string
  items: InvoiceItem[]
  subtotal: number
  tax: number
  discount: number
  total: number
  status: "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled"
  issueDate: string
  dueDate: string
  paidDate?: string
  notes?: string
}

// Mock data for invoices
const mockInvoices: Invoice[] = [
  {
    key: "1",
    id: "INV001",
    invoiceNumber: "INV-2025-001",
    customerName: "John Smith",
    customerEmail: "john.smith@email.com",
    customerAddress: "123 Main Street, New York, NY 10001",
    items: [
      { id: "1", description: "Nike T-shirt Basic", quantity: 2, unitPrice: 25.0, total: 50.0 },
      { id: "2", description: "Adidas Sneakers", quantity: 1, unitPrice: 89.99, total: 89.99 },
    ],
    subtotal: 139.99,
    tax: 14.0,
    discount: 0,
    total: 153.99,
    status: "Paid",
    issueDate: "2025-01-10",
    dueDate: "2025-01-25",
    paidDate: "2025-01-15",
  },
  {
    key: "2",
    id: "INV002",
    invoiceNumber: "INV-2025-002",
    customerName: "Sarah Johnson",
    customerEmail: "sarah.j@email.com",
    customerAddress: "456 Oak Avenue, Los Angeles, CA 90210",
    items: [
      { id: "1", description: "Mom Jeans Slim Fit", quantity: 1, unitPrice: 45.0, total: 45.0 },
      { id: "2", description: "Cotton Blouse", quantity: 1, unitPrice: 35.5, total: 35.5 },
    ],
    subtotal: 80.5,
    tax: 8.05,
    discount: 5.0,
    total: 83.55,
    status: "Sent",
    issueDate: "2025-01-12",
    dueDate: "2025-01-27",
  },
  {
    key: "3",
    id: "INV003",
    invoiceNumber: "INV-2025-003",
    customerName: "Mike Wilson",
    customerEmail: "mike.w@email.com",
    customerAddress: "789 Pine Road, Chicago, IL 60601",
    items: [{ id: "1", description: "New Balance 327", quantity: 1, unitPrice: 51.9, total: 51.9 }],
    subtotal: 51.9,
    tax: 5.19,
    discount: 0,
    total: 57.09,
    status: "Overdue",
    issueDate: "2024-12-15",
    dueDate: "2024-12-30",
  },
  {
    key: "4",
    id: "INV004",
    invoiceNumber: "INV-2025-004",
    customerName: "Emma Davis",
    customerEmail: "emma.d@email.com",
    customerAddress: "321 Elm Street, Miami, FL 33101",
    items: [{ id: "1", description: "Summer Dress", quantity: 1, unitPrice: 65.0, total: 65.0 }],
    subtotal: 65.0,
    tax: 6.5,
    discount: 10.0,
    total: 61.5,
    status: "Draft",
    issueDate: "2025-01-14",
    dueDate: "2025-01-29",
  },
]

export default function Invoice() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices)
  const [loading, setLoading] = useState(false)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [searchText, setSearchText] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [form] = Form.useForm()

  // Filter invoices based on search and filters
  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.customerName.toLowerCase().includes(searchText.toLowerCase()) ||
      invoice.invoiceNumber.toLowerCase().includes(searchText.toLowerCase()) ||
      invoice.customerEmail.toLowerCase().includes(searchText.toLowerCase())
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // Calculate statistics
  const totalInvoices = invoices.length
  const paidInvoices = invoices.filter((inv) => inv.status === "Paid").length
  const overdueInvoices = invoices.filter((inv) => inv.status === "Overdue").length
  const totalRevenue = invoices.filter((inv) => inv.status === "Paid").reduce((sum, invoice) => sum + invoice.total, 0)

  const handleAddInvoice = () => {
    setEditingInvoice(null)
    form.resetFields()
    form.setFieldsValue({
      items: [{ description: "", quantity: 1, unitPrice: 0 }],
      tax: 10,
      discount: 0,
    })
    setIsModalVisible(true)
  }

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice)
    form.setFieldsValue({
      ...invoice,
      issueDate: dayjs(invoice.issueDate),
      dueDate: dayjs(invoice.dueDate),
      paidDate: invoice.paidDate ? dayjs(invoice.paidDate) : null,
    })
    setIsModalVisible(true)
  }

  const handleDeleteInvoice = (invoiceId: string) => {
    Modal.confirm({
      title: "Delete Invoice",
      content: "Are you sure you want to delete this invoice? This action cannot be undone.",
      okText: "Delete",
      okType: "danger",
      onOk: () => {
        setInvoices(invoices.filter((invoice) => invoice.id !== invoiceId))
        message.success("Invoice deleted successfully")
      },
    })
  }

  const calculateTotals = (items: InvoiceItem[], tax: number, discount: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const taxAmount = (subtotal * tax) / 100
    const total = subtotal + taxAmount - discount
    return { subtotal, taxAmount, total }
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()

      // Calculate totals
      const items = values.items.map((item: any, index: number) => ({
        id: `${index + 1}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      }))

      const { subtotal, taxAmount, total } = calculateTotals(items, values.tax || 0, values.discount || 0)

      if (editingInvoice) {
        // Update existing invoice
        setInvoices(
          invoices.map((invoice) =>
            invoice.id === editingInvoice.id
              ? {
                  ...invoice,
                  ...values,
                  items,
                  subtotal,
                  tax: taxAmount,
                  total,
                  issueDate: values.issueDate.format("YYYY-MM-DD"),
                  dueDate: values.dueDate.format("YYYY-MM-DD"),
                  paidDate: values.paidDate ? values.paidDate.format("YYYY-MM-DD") : undefined,
                }
              : invoice,
          ),
        )
        message.success("Invoice updated successfully")
      } else {
        // Add new invoice
        const newInvoice: Invoice = {
          ...values,
          key: `${invoices.length + 1}`,
          id: `INV${String(invoices.length + 1).padStart(3, "0")}`,
          invoiceNumber: `INV-2025-${String(invoices.length + 1).padStart(3, "0")}`,
          items,
          subtotal,
          tax: taxAmount,
          total,
          issueDate: values.issueDate.format("YYYY-MM-DD"),
          dueDate: values.dueDate.format("YYYY-MM-DD"),
          paidDate: values.paidDate ? values.paidDate.format("YYYY-MM-DD") : undefined,
        }
        setInvoices([...invoices, newInvoice])
        message.success("Invoice created successfully")
      }

      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error("Failed to save invoice")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "green"
      case "Sent":
        return "blue"
      case "Draft":
        return "gray"
      case "Overdue":
        return "red"
      case "Cancelled":
        return "red"
      default:
        return "default"
    }
  }

  const columns: ColumnsType<Invoice> = [
    {
      title: "Invoice",
      dataIndex: "invoiceNumber",
      key: "invoiceNumber",
      render: (text: string, record: Invoice) => (
        <div>
          <div className="font-medium text-gray-900">{text}</div>
          <div className="text-sm text-gray-500">{record.id}</div>
        </div>
      ),
      sorter: (a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber),
    },
    {
      title: "Customer",
      dataIndex: "customerName",
      key: "customerName",
      render: (text: string, record: Invoice) => (
        <div>
          <div className="font-medium text-gray-900">{text}</div>
          <div className="text-sm text-gray-500">{record.customerEmail}</div>
        </div>
      ),
      sorter: (a, b) => a.customerName.localeCompare(b.customerName),
    },
    {
      title: "Amount",
      dataIndex: "total",
      key: "total",
      render: (amount: number) => <span className="font-medium text-gray-900">€{amount.toFixed(2)}</span>,
      sorter: (a, b) => a.total - b.total,
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
        { text: "Draft", value: "Draft" },
        { text: "Sent", value: "Sent" },
        { text: "Paid", value: "Paid" },
        { text: "Overdue", value: "Overdue" },
        { text: "Cancelled", value: "Cancelled" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Issue Date",
      dataIndex: "issueDate",
      key: "issueDate",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
      sorter: (a, b) => dayjs(a.issueDate).unix() - dayjs(b.issueDate).unix(),
    },
    {
      title: "Due Date",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date: string) => dayjs(date).format("MMM DD, YYYY"),
      sorter: (a, b) => dayjs(a.dueDate).unix() - dayjs(b.dueDate).unix(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record: Invoice) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                icon: <EyeOutlined />,
                label: "View Invoice",
              },
              {
                key: "edit",
                icon: <EditOutlined />,
                label: "Edit Invoice",
                onClick: () => handleEditInvoice(record),
              },
              {
                key: "print",
                icon: <PrinterOutlined />,
                label: "Print",
              },
              {
                key: "send",
                icon: <SendOutlined />,
                label: "Send Email",
              },
              {
                type: "divider",
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: "Delete",
                danger: true,
                onClick: () => handleDeleteInvoice(record.id),
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
              Invoice Management
            </Title>
            <Text className="text-gray-500">Create, manage and track your invoices</Text>
          </div>
          <Space>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-cyan-500 border-cyan-500"
              onClick={handleAddInvoice}
            >
              Create Invoice
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-cyan-500">
              <Statistic
                title="Total Invoices"
                value={totalInvoices}
                prefix={<FileTextOutlined className="text-cyan-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Paid Invoices"
                value={paidInvoices}
                prefix={<CheckCircleOutlined className="text-green-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-red-500">
              <Statistic
                title="Overdue"
                value={overdueInvoices}
                prefix={<CalendarOutlined className="text-red-500" />}
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
                <Select.Option value="Draft">Draft</Select.Option>
                <Select.Option value="Sent">Sent</Select.Option>
                <Select.Option value="Paid">Paid</Select.Option>
                <Select.Option value="Overdue">Overdue</Select.Option>
                <Select.Option value="Cancelled">Cancelled</Select.Option>
              </Select>
            </Space>
            <Input
              placeholder="Search invoices, customers..."
              prefix={<SearchOutlined className="text-gray-400" />}
              className="max-w-md"
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {selectedRowKeys.length > 0 && (
              <Space>
                <Text className="text-gray-600">{selectedRowKeys.length} selected</Text>
                <Button size="small">Bulk Send</Button>
                <Button size="small" danger>
                  Bulk Delete
                </Button>
              </Space>
            )}
          </div>
        </Card>

        {/* Invoices Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={filteredInvoices}
            rowSelection={rowSelection}
            loading={loading}
            pagination={{
              total: filteredInvoices.length,
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} invoices`,
            }}
            scroll={{ x: 1200 }}
            className="custom-table"
          />
        </Card>

        {/* Add/Edit Invoice Modal */}
        <Modal
          title={editingInvoice ? "Edit Invoice" : "Create New Invoice"}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => setIsModalVisible(false)}
          width={900}
          okText={editingInvoice ? "Update Invoice" : "Create Invoice"}
          okButtonProps={{ className: "bg-cyan-500 border-cyan-500" }}
        >
          <Form form={form} layout="vertical" className="mt-4">
            {/* Customer Information */}
            <Title level={5}>Customer Information</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="customerName"
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

            <Form.Item
              name="customerAddress"
              label="Customer Address"
              rules={[{ required: true, message: "Please enter customer address" }]}
            >
              <Input.TextArea rows={2} placeholder="Enter customer address" />
            </Form.Item>

            <Divider />

            {/* Invoice Details */}
            <Title level={5}>Invoice Details</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="status" label="Status" rules={[{ required: true, message: "Please select status" }]}>
                  <Select placeholder="Select status">
                    <Select.Option value="Draft">Draft</Select.Option>
                    <Select.Option value="Sent">Sent</Select.Option>
                    <Select.Option value="Paid">Paid</Select.Option>
                    <Select.Option value="Overdue">Overdue</Select.Option>
                    <Select.Option value="Cancelled">Cancelled</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="issueDate"
                  label="Issue Date"
                  rules={[{ required: true, message: "Please select issue date" }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="dueDate"
                  label="Due Date"
                  rules={[{ required: true, message: "Please select due date" }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* Invoice Items */}
            <Title level={5}>Invoice Items</Title>
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={16} align="middle">
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, "description"]}
                          rules={[{ required: true, message: "Missing description" }]}
                        >
                          <Input placeholder="Item description" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "quantity"]}
                          rules={[{ required: true, message: "Missing quantity" }]}
                        >
                          <InputNumber min={1} placeholder="Qty" className="w-full" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, "unitPrice"]}
                          rules={[{ required: true, message: "Missing price" }]}
                        >
                          <InputNumber
                            min={0}
                            step={0.01}
                            placeholder="Unit Price"
                            className="w-full"
                            addonBefore="€"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Button type="text" icon={<MinusCircleOutlined />} onClick={() => remove(name)} danger />
                      </Col>
                    </Row>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Add Item
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            <Divider />

            {/* Totals */}
            <Title level={5}>Totals</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="tax" label="Tax (%)">
                  <InputNumber min={0} max={100} className="w-full" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="discount" label="Discount (€)">
                  <InputNumber min={0} step={0.01} className="w-full" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="paidDate" label="Paid Date">
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
