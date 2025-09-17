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
  status: "Nháp" | "Đã Gửi" | "Đã Thanh Toán" | "Quá Hạn" | "Hủy"
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
    customerName: "Nguyễn Văn An",
    customerEmail: "an.nguyen@email.com",
    customerAddress: "123 Đường Láng, Hà Nội",
    items: [
      { id: "1", description: "Áo thun Nike Cơ Bản", quantity: 2, unitPrice: 500000, total: 1000000 },
      { id: "2", description: "Giày Adidas", quantity: 1, unitPrice: 2000000, total: 2000000 },
    ],
    subtotal: 3000000,
    tax: 300000,
    discount: 0,
    total: 3300000,
    status: "Đã Thanh Toán",
    issueDate: "2025-01-10",
    dueDate: "2025-01-25",
    paidDate: "2025-01-15",
  },
  {
    key: "2",
    id: "INV002",
    invoiceNumber: "INV-2025-002",
    customerName: "Trần Thị Bình",
    customerEmail: "binh.tran@email.com",
    customerAddress: "456 Nguyễn Trãi, TP.HCM",
    items: [
      { id: "1", description: "Quần Jeans Slim Fit", quantity: 1, unitPrice: 1000000, total: 1000000 },
      { id: "2", description: "Áo sơ mi Cotton", quantity: 1, unitPrice: 800000, total: 800000 },
    ],
    subtotal: 1800000,
    tax: 180000,
    discount: 100000,
    total: 1880000,
    status: "Đã Gửi",
    issueDate: "2025-01-12",
    dueDate: "2025-01-27",
  },
  {
    key: "3",
    id: "INV003",
    invoiceNumber: "INV-2025-003",
    customerName: "Lê Văn Cường",
    customerEmail: "cuong.le@email.com",
    customerAddress: "789 Lê Lợi, Đà Nẵng",
    items: [{ id: "1", description: "Giày New Balance 327", quantity: 1, unitPrice: 1200000, total: 1200000 }],
    subtotal: 1200000,
    tax: 120000,
    discount: 0,
    total: 1320000,
    status: "Quá Hạn",
    issueDate: "2024-12-15",
    dueDate: "2024-12-30",
  },
  {
    key: "4",
    id: "INV004",
    invoiceNumber: "INV-2025-004",
    customerName: "Phạm Thị Duyên",
    customerEmail: "duyen.pham@email.com",
    customerAddress: "321 Trần Phú, Hải Phòng",
    items: [{ id: "1", description: "Váy Mùa Hè", quantity: 1, unitPrice: 1500000, total: 1500000 }],
    subtotal: 1500000,
    tax: 150000,
    discount: 200000,
    total: 1450000,
    status: "Nháp",
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
  const paidInvoices = invoices.filter((inv) => inv.status === "Đã Thanh Toán").length
  const overdueInvoices = invoices.filter((inv) => inv.status === "Quá Hạn").length
  const totalRevenue = invoices.filter((inv) => inv.status === "Đã Thanh Toán").reduce((sum, invoice) => sum + invoice.total, 0)

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
      title: "Xóa Hóa Đơn",
      content: "Bạn có chắc chắn muốn xóa hóa đơn này? Hành động này không thể hoàn tác.",
      okText: "Xóa",
      okType: "danger",
      onOk: () => {
        setInvoices(invoices.filter((invoice) => invoice.id !== invoiceId))
        message.success("Xóa hóa đơn thành công")
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
        message.success("Cập nhật hóa đơn thành công")
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
        message.success("Tạo hóa đơn thành công")
      }

      setIsModalVisible(false)
      form.resetFields()
    } catch (error) {
      message.error("Không thể lưu hóa đơn")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Đã Thanh Toán":
        return "green"
      case "Đã Gửi":
        return "blue"
      case "Nháp":
        return "gray"
      case "Quá Hạn":
        return "red"
      case "Hủy":
        return "red"
      default:
        return "default"
    }
  }

  const columns: ColumnsType<Invoice> = [
    {
      title: "Hóa Đơn",
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
      title: "Khách Hàng",
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
      title: "Tổng Tiền",
      dataIndex: "total",
      key: "total",
      render: (amount: number) => <span className="font-medium text-gray-900">₫{amount.toLocaleString('vi-VN')}</span>,
      sorter: (a, b) => a.total - b.total,
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
        { text: "Nháp", value: "Nháp" },
        { text: "Đã Gửi", value: "Đã Gửi" },
        { text: "Đã Thanh Toán", value: "Đã Thanh Toán" },
        { text: "Quá Hạn", value: "Quá Hạn" },
        { text: "Hủy", value: "Hủy" },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: "Ngày Phát Hành",
      dataIndex: "issueDate",
      key: "issueDate",
      render: (date: string) => dayjs(date).format("DD MMM, YYYY"),
      sorter: (a, b) => dayjs(a.issueDate).unix() - dayjs(b.issueDate).unix(),
    },
    {
      title: "Ngày Hạn Thanh Toán",
      dataIndex: "dueDate",
      key: "dueDate",
      render: (date: string) => dayjs(date).format("DD MMM, YYYY"),
      sorter: (a, b) => dayjs(a.dueDate).unix() - dayjs(b.dueDate).unix(),
    },
    {
      title: "Hành Động",
      key: "actions",
      render: (_, record: Invoice) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                icon: <EyeOutlined />,
                label: "Xem Hóa Đơn",
              },
              {
                key: "edit",
                icon: <EditOutlined />,
                label: "Chỉnh Sửa Hóa Đơn",
                onClick: () => handleEditInvoice(record),
              },
              {
                key: "print",
                icon: <PrinterOutlined />,
                label: "In",
              },
              {
                key: "send",
                icon: <SendOutlined />,
                label: "Gửi Email",
              },
              {
                type: "divider",
              },
              {
                key: "delete",
                icon: <DeleteOutlined />,
                label: "Xóa",
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
              Quản Lý Hóa Đơn
            </Title>
            <Text className="text-gray-500">Tạo, quản lý và theo dõi hóa đơn của bạn</Text>
          </div>
          <Space>
            <Button icon={<ExportOutlined />}>Xuất Dữ Liệu</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="bg-cyan-500 border-cyan-500"
              onClick={handleAddInvoice}
            >
              Tạo Hóa Đơn
            </Button>
          </Space>
        </div>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-cyan-500">
              <Statistic
                title="Tổng Hóa Đơn"
                value={totalInvoices}
                prefix={<FileTextOutlined className="text-cyan-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-green-500">
              <Statistic
                title="Hóa Đơn Đã Thanh Toán"
                value={paidInvoices}
                prefix={<CheckCircleOutlined className="text-green-500" />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="border-l-4 border-l-red-500">
              <Statistic
                title="Quá Hạn"
                value={overdueInvoices}
                prefix={<CalendarOutlined className="text-red-500" />}
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
                <Select.Option value="Nháp">Nháp</Select.Option>
                <Select.Option value="Đã Gửi">Đã Gửi</Select.Option>
                <Select.Option value="Đã Thanh Toán">Đã Thanh Toán</Select.Option>
                <Select.Option value="Quá Hạn">Quá Hạn</Select.Option>
                <Select.Option value="Hủy">Hủy</Select.Option>
              </Select>
            </Space>
            <Input
              placeholder="Tìm kiếm hóa đơn, khách hàng..."
              prefix={<SearchOutlined className="text-gray-400" />}
              className="max-w-md"
              size="large"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {selectedRowKeys.length > 0 && (
              <Space>
                <Text className="text-gray-600">Đã chọn {selectedRowKeys.length}</Text>
                <Button size="small">Gửi Hàng Loạt</Button>
                <Button size="small" danger>
                  Xóa Hàng Loạt
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
              showTotal: (total, range) => `${range[0]}-${range[1]} trên tổng số ${total} hóa đơn`,
            }}
            scroll={{ x: 1200 }}
            className="custom-table"
          />
        </Card>

        {/* Add/Edit Invoice Modal */}
        <Modal
          title={editingInvoice ? "Chỉnh Sửa Hóa Đơn" : "Tạo Hóa Đơn Mới"}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={() => setIsModalVisible(false)}
          width={900}
          okText={editingInvoice ? "Cập Nhật Hóa Đơn" : "Tạo Hóa Đơn"}
          okButtonProps={{ className: "bg-cyan-500 border-cyan-500" }}
        >
          <Form form={form} layout="vertical" className="mt-4">
            {/* Customer Information */}
            <Title level={5}>Thông Tin Khách Hàng</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="customerName"
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

            <Form.Item
              name="customerAddress"
              label="Địa Chỉ Khách Hàng"
              rules={[{ required: true, message: "Vui lòng nhập địa chỉ khách hàng" }]}
            >
              <Input.TextArea rows={2} placeholder="Nhập địa chỉ khách hàng" />
            </Form.Item>

            <Divider />

            {/* Invoice Details */}
            <Title level={5}>Chi Tiết Hóa Đơn</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="status" label="Trạng Thái" rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}>
                  <Select placeholder="Chọn trạng thái">
                    <Select.Option value="Nháp">Nháp</Select.Option>
                    <Select.Option value="Đã Gửi">Đã Gửi</Select.Option>
                    <Select.Option value="Đã Thanh Toán">Đã Thanh Toán</Select.Option>
                    <Select.Option value="Quá Hạn">Quá Hạn</Select.Option>
                    <Select.Option value="Hủy">Hủy</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="issueDate"
                  label="Ngày Phát Hành"
                  rules={[{ required: true, message: "Vui lòng chọn ngày phát hành" }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="dueDate"
                  label="Ngày Hạn Thanh Toán"
                  rules={[{ required: true, message: "Vui lòng chọn ngày hạn thanh toán" }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* Invoice Items */}
            <Title level={5}>Mục Hóa Đơn</Title>
            <Form.List name="items">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Row key={key} gutter={16} align="middle">
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, "description"]}
                          rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
                        >
                          <Input placeholder="Mô tả sản phẩm" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, "quantity"]}
                          rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
                        >
                          <InputNumber min={1} placeholder="Số lượng" className="w-full" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, "unitPrice"]}
                          rules={[{ required: true, message: "Vui lòng nhập giá" }]}
                        >
                          <InputNumber
                            min={0}
                            step={1000}
                            placeholder="Đơn giá"
                            className="w-full"
                            addonBefore="₫"
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
                      Thêm Mục
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>

            <Divider />

            {/* Totals */}
            <Title level={5}>Tổng Cộng</Title>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="tax" label="Thuế (%)">
                  <InputNumber min={0} max={100} className="w-full" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="discount" label="Giảm Giá (₫)">
                  <InputNumber min={0} step={1000} className="w-full" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="paidDate" label="Ngày Thanh Toán">
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
