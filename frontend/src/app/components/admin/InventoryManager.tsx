import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Card,
  Statistic,
  Tag,
  Row,
  Col,
  message,
  AutoComplete,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

interface Store {
  id: number;
  name: string;
  user_id: number;
}

interface Brand {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  store?: Store;
  brand?: Brand;
}

interface Variant {
  id: number;
  name: string;
  product_id: number;
  price?: number;
  stock?: number;
}

interface Inventory {
  id: number;
  uuid: string;
  product: Product;
  variant?: Variant | null;
  location: string;
  quantity: number;
  used_quantity: number;
  updated_at: string;
  available_quantity: number;
}

interface CreateInventoryDto {
  productId: number;
  variantId?: number | null;
  location: string;
  quantity: number;
  used_quantity?: number;
}

const InventoryManager: React.FC = () => {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [filteredInventories, setFilteredInventories] = useState<Inventory[]>(
    []
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const token = localStorage.getItem('token');

  // ==== Filter/Search states ====
  const [searchText, setSearchText] = useState('');
  const [brandFilter, setBrandFilter] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // ==== Statistics ====
  const totalItems = inventories.reduce((sum, inv) => sum + inv.quantity, 0);
  const totalUsed = inventories.reduce(
    (sum, inv) => sum + (inv.used_quantity || 0),
    0
  );
  const totalAvailable = inventories.reduce(
    (sum, inv) => sum + (inv.available_quantity || 0),
    0
  );
  const lowStockItems = inventories.filter(
    (inv) => (inv.available_quantity || 0) < 10
  ).length;

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchInventories(), fetchProducts()]);
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchText, brandFilter, statusFilter, inventories]);

  // ==== API Configuration ====
  const apiClient = axios.create({
    baseURL: 'http://localhost:3000',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const errorMessage =
        error.response?.data?.message || error.message || 'An error occurred';
      message.error(errorMessage);
      return Promise.reject(error);
    }
  );

  // ==== API calls ====
  const fetchInventories = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/inventory');
      const inventoryData = Array.isArray(res.data) ? res.data : [];
      const mapped: Inventory[] = inventoryData.map((inv: any) => ({
        id: inv.id,
        uuid: inv.uuid,
        product: {
          id: inv.product?.id,
          name: inv.product?.name,
          store: inv.product?.store,
          brand: inv.product?.brand,
        },
        variant: inv.variant
          ? {
              id: inv.variant.id,
              name: inv.variant.variant_name || inv.variant.name,
              product_id: inv.variant.product_id,
              price: inv.variant.price,
              stock: inv.variant.stock,
            }
          : null,
        location: inv.location,
        quantity: inv.quantity,
        used_quantity: inv.used_quantity || 0,
        updated_at: inv.updated_at,
        available_quantity:
          inv.available_quantity || inv.quantity - (inv.used_quantity || 0),
      }));
      setInventories(mapped);
      setFilteredInventories(mapped);
    } catch (err) {
      setInventories([]);
      setFilteredInventories([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await apiClient.get('/products');
      const productData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      const mapped: Product[] = productData.map((p: any) => ({
        id: p.id,
        name: p.name,
        store: p.store,
        brand: p.brand,
      }));
      setProducts(mapped);
    } catch (err) {
      setProducts([]);
    }
  };

  const fetchVariantsByProduct = async (productId: number) => {
    try {
      const res = await apiClient.get(`/variants/product/${productId}`);
      const variantData = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];
      const mapped: Variant[] = variantData.map((v: any) => ({
        id: v.id,
        name: v.variant_name || v.name,
        product_id: v.product_id,
        price: v.price,
        stock: v.stock,
      }));
      setVariants(mapped);
    } catch (err) {
      setVariants([]);
    }
  };

  // ==== CRUD handlers ====
  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      const payload: CreateInventoryDto = {
        productId: values.productId,
        variantId: values.variantId || null,
        location: values.location,
        quantity: values.quantity,
        used_quantity: values.used_quantity || 0,
      };

      let res;
      if (editingInventory) {
        res = await apiClient.patch(
          `/inventory/${editingInventory.id}`,
          payload
        );
        message.success('Cập nhật tồn kho thành công');
      } else {
        res = await apiClient.post('/inventory', payload);
        message.success('Thêm tồn kho thành công');
      }

      setShowModal(false);
      setEditingInventory(null);
      form.resetFields();
      setVariants([]);
      await fetchInventories();
    } catch (err) {
      console.error('Save inventory failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (inventory: Inventory) => {
    setEditingInventory(inventory);
    form.setFieldsValue({
      productId: inventory.product.id,
      variantId: inventory.variant?.id || null,
      location: inventory.location,
      quantity: inventory.quantity,
      used_quantity: inventory.used_quantity || 0,
    });
    if (inventory.product.id) {
      await fetchVariantsByProduct(inventory.product.id);
    }
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa tồn kho này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await apiClient.delete(`/inventory/${id}`);
          message.success('Xóa tồn kho thành công');
          await fetchInventories();
        } catch (err) {
          console.error('Delete inventory failed:', err);
        }
      },
    });
  };

  const handleProductChange = async (productId: number) => {
    form.setFieldValue('variantId', null);
    setVariants([]);
    if (productId) {
      await fetchVariantsByProduct(productId);
    }
  };

  const openAddModal = () => {
    setEditingInventory(null);
    form.resetFields();
    setVariants([]);
    setShowModal(true);
  };

  // ==== Helpers ====
  const getStockStatus = (available: number) => {
    if (available <= 0) return <Tag color="red">Hết hàng</Tag>;
    if (available < 10) return <Tag color="orange">Sắp hết</Tag>;
    if (available < 50) return <Tag color="yellow">Còn ít</Tag>;
    return <Tag color="green">Còn nhiều</Tag>;
  };

  const applyFilters = () => {
    let data = [...inventories];

    if (searchText) {
      data = data.filter((inv) =>
        inv.product.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (brandFilter) {
      data = data.filter((inv) => inv.product.brand?.id === brandFilter);
    }

    if (statusFilter) {
      data = data.filter((inv) => {
        const available = inv.available_quantity || 0;
        if (statusFilter === 'out') return available <= 0;
        if (statusFilter === 'low') return available > 0 && available < 10;
        if (statusFilter === 'medium') return available >= 10 && available < 50;
        if (statusFilter === 'high') return available >= 50;
        return true;
      });
    }

    setFilteredInventories(data);
  };

  // ==== Table Columns ====
  const columns = [
    {
      title: 'Sản phẩm',
      dataIndex: ['product', 'name'],
      key: 'product',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'Thương hiệu',
      dataIndex: ['product', 'brand', 'name'],
      key: 'brand',
      width: 100,
      ellipsis: true,
      render: (name: string) => name || 'N/A',
    },
    {
      title: 'Biến thể',
      dataIndex: ['variant', 'name'],
      key: 'variant',
      width: 120,
      ellipsis: true,
      render: (name: string) => name || 'Không có biến thể',
    },
    {
      title: 'Vị trí',
      dataIndex: 'location',
      key: 'location',
      width: 100,
    },
    {
      title: 'Tổng SL',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      render: (quantity: number) => (
        <span className="font-semibold">{quantity?.toLocaleString() || 0}</span>
      ),
    },
    {
      title: 'Đã dùng',
      dataIndex: 'used_quantity',
      key: 'used_quantity',
      width: 90,
      render: (used: number) => (
        <span className="text-red-600">{used?.toLocaleString() || 0}</span>
      ),
    },
    {
      title: 'Khả dụng',
      key: 'available',
      width: 90,
      render: (record: Inventory) => (
        <span className="font-semibold text-green-600">
          {record.available_quantity?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 100,
      render: (record: Inventory) =>
        getStockStatus(record.available_quantity || 0),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 100,
      render: (date: string) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('vi-VN');
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (record: Inventory) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="h-full overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-900 m-0">Quản lý kho</h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openAddModal}
          size="middle"
        >
          Thêm tồn kho
        </Button>
      </div>

      {/* Filters */}
      <Row gutter={12} className="mb-4">
        <Col xs={24} sm={8}>
          <Input
            prefix={<SearchOutlined />}
            placeholder="Tìm kiếm sản phẩm..."
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={8}>
          <Select
            allowClear
            style={{ width: '100%' }}
            placeholder="Lọc theo thương hiệu"
            value={brandFilter || undefined}
            onChange={(val) => setBrandFilter(val || null)}
          >
            {[...new Map(products.map((p) => [p.brand?.id, p.brand])).values()]
              .filter((b) => b)
              .map((brand: any) => (
                <Option key={brand.id} value={brand.id}>
                  {brand.name}
                </Option>
              ))}
          </Select>
        </Col>
        <Col xs={24} sm={8}>
          <Select
            allowClear
            style={{ width: '100%' }}
            placeholder="Lọc theo trạng thái"
            value={statusFilter || undefined}
            onChange={(val) => setStatusFilter(val || null)}
          >
            <Option value="out">Hết hàng</Option>
            <Option value="low">Sắp hết (&lt; 10)</Option>
            <Option value="medium">Còn ít (10 - 49)</Option>
            <Option value="high">Còn nhiều (≥ 50)</Option>
          </Select>
        </Col>
      </Row>

      {/* Statistics */}
      <Row gutter={12} className="mb-4">
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="h-20">
            <Statistic
              title="Tổng số lượng"
              value={totalItems}
              formatter={(value) => value?.toLocaleString() || '0'}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ fontSize: '18px', lineHeight: '1.2' }}
              className="text-center"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="h-20">
            <Statistic
              title="Đã sử dụng"
              value={totalUsed}
              formatter={(value) => value?.toLocaleString() || '0'}
              valueStyle={{
                color: '#cf1322',
                fontSize: '18px',
                lineHeight: '1.2',
              }}
              className="text-center"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="h-20">
            <Statistic
              title="Khả dụng"
              value={totalAvailable}
              formatter={(value) => value?.toLocaleString() || '0'}
              valueStyle={{
                color: '#389e0d',
                fontSize: '18px',
                lineHeight: '1.2',
              }}
              className="text-center"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card size="small" className="h-20">
            <Statistic
              title="Sắp hết hàng"
              value={lowStockItems}
              prefix={<WarningOutlined style={{ color: '#faad14' }} />}
              valueStyle={{
                color: '#faad14',
                fontSize: '18px',
                lineHeight: '1.2',
              }}
              className="text-center"
            />
          </Card>
        </Col>
      </Row>

      {/* Inventory Table */}
      <Card
        size="small"
        bodyStyle={{ padding: '12px' }}
        className="flex-1 overflow-hidden"
      >
        <Table
          dataSource={filteredInventories}
          columns={columns}
          rowKey="id"
          loading={loading}
          size="small"
          pagination={{
            total: filteredInventories.length,
            pageSize: 20,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
          }}
          className="compact-table"
          style={{ width: '100%' }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingInventory ? 'Cập nhật tồn kho' : 'Thêm tồn kho'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          setEditingInventory(null);
          form.resetFields();
          setVariants([]);
        }}
        onOk={() => form.submit()}
        confirmLoading={loading}
        width={520}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="mt-4"
          size="small"
        >
          <Form.Item
            name="productId"
            label="Sản phẩm"
            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
          >
            <Select
              placeholder="Chọn sản phẩm"
              showSearch
              optionFilterProp="children"
              onChange={handleProductChange}
            >
              {products.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="variantId" label="Biến thể (nếu có)">
            <Select placeholder="Chọn biến thể (tuỳ chọn)">
              {variants.map((v) => (
                <Option key={v.id} value={v.id}>
                  {v.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="location"
            label="Vị trí"
            rules={[{ required: true, message: 'Vui lòng nhập vị trí kho' }]}
          >
            <Input placeholder="Nhập vị trí kho" />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
          >
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="Nhập số lượng"
            />
          </Form.Item>

          <Form.Item name="used_quantity" label="Đã sử dụng">
            <InputNumber
              min={0}
              style={{ width: '100%' }}
              placeholder="Nhập số lượng đã dùng"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InventoryManager;
