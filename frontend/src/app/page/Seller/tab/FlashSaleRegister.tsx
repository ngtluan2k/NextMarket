import React, { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Button,
  InputNumber,
  message,
  Space,
  Typography,
  Collapse,
  Divider,
  Empty,
  Tooltip,
} from 'antd';
import { productService, Product } from '../../../../service/product.service';
import {
  registerStoreFlashSale,
  getRegisteredProductsForStore,
  updateStoreRegistration,
} from '../../../../service/flash_sale.service';
import {
  ArrowLeftOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title, Text } = Typography;
const { Panel } = Collapse;

const FlashSaleRegister = ({ scheduleId, storeId, onBack }: any) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formValues, setFormValues] = useState<Record<number, any>>({});

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        const [data, registered] = await Promise.all([
          productService.getStoreProducts(storeId),
          getRegisteredProductsForStore(scheduleId, token!),
        ]);

        // 🧩 Lọc chỉ sản phẩm có variant và đang active
        const active = data.filter(
          (p: any) => p.status === 'active' && p.variants?.length > 0
        );

        // ⚡ Gộp thông tin đã đăng ký vào danh sách variant
        const merged = active.map((p: any) => ({
          ...p,
          variants: p.variants.map((v: any) => {
            const found = registered.find((r: any) => r.variant_id === v.id);
            return found
              ? {
                  ...v,
                  flash_sale_price: found.price,
                  flash_sale_limit: found.limit_quantity,
                  is_registered: true,
                }
              : { ...v, is_registered: false };
          }),
        }));

        setProducts(merged);
      } catch (err) {
        console.error(err);
        message.error('Không thể tải sản phẩm');
      }
    };
    fetchProducts();
  }, [storeId, scheduleId]);

  const handleValueChange = (
    productId: number,
    variantId: number,
    field: 'price' | 'limit_quantity',
    value: number,
    record?: any
  ) => {
    setFormValues((prev) => ({
      ...prev,
      [variantId]: {
        ...(prev[variantId] || {}),
        [field]: value,
      },
    }));

    setSelected((prev) => {
      const exists = prev.find(
        (p) => p.product_id === productId && p.variant_id === variantId
      );

      if (exists) {
        return prev.map((p) =>
          p.product_id === productId && p.variant_id === variantId
            ? { ...p, [field]: value }
            : p
        );
      }

      // Lấy giá trị hiện tại trên UI để khởi tạo
      const currentForm = formValues[variantId] || {};
      const currentPrice =
        field === 'price'
          ? value
          : currentForm.price ?? record?.flash_sale_price ?? 0;
      const currentLimit =
        field === 'limit_quantity'
          ? value
          : currentForm.limit_quantity ?? record?.flash_sale_limit ?? 0;

      return [
        ...prev,
        {
          product_id: productId,
          variant_id: variantId,
          price: currentPrice,
          limit_quantity: currentLimit,
        },
      ];
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const hasRegistered = selected.some((p) =>
        products.some((prod) =>
          prod.variants?.some(
            (v: any) => v.id === p.variant_id && v.is_registered
          )
        )
      );

      if (hasRegistered) {
        // 🔁 Cập nhật các sản phẩm đã đăng ký
        await updateStoreRegistration(
          scheduleId,
          { product_variant_ids: selected },
          token!
        );
        message.success('Cập nhật Flash Sale thành công!');
      } else {
        // 🆕 Đăng ký mới
        await registerStoreFlashSale(
          storeId,
          { schedule_id: scheduleId, product_variant_ids: selected },
          token!
        );
        message.success('Đăng ký Flash Sale thành công!');
      }

      onBack();
    } catch (err) {
      console.error(err);
      message.error('Thao tác thất bại');
    } finally {
      setLoading(false);
    }
  };

  const columns = (productId: number): ColumnsType<any> => [
    {
      title: 'Tên biến thể',
      dataIndex: 'variant_name',
      key: 'variant_name',
      width: 220,
      render: (text: string, record: any) => (
        <span>
          {text}{' '}
          {record.is_registered && (
            <span style={{ color: '#52c41a', fontWeight: 500 }}>
              (Đã đăng ký)
            </span>
          )}
        </span>
      ),
    },

    {
      title: 'Giá gốc',
      dataIndex: 'price',
      key: 'price',
      render: (value: number) => (
        <span style={{ fontWeight: 500, color: '#1890ff' }}>
          {new Intl.NumberFormat('vi-VN').format(value)} ₫
        </span>
      ),
    },
    {
      title: 'Giá khuyến mãi',
      key: 'price_discount',
      render: (_: any, record: any) => {
        // Tìm trong selected xem biến thể này có bị thay đổi chưa
        const selectedItem = selected.find(
          (p) => p.product_id === productId && p.variant_id === record.id
        );

        const value =
          formValues[record.id]?.price ?? record.flash_sale_price ?? 0;

        return (
          <InputNumber<number>
            min={0}
            style={{ width: '100%' }}
            value={formValues[record.id]?.price ?? record.flash_sale_price ?? 0}
            placeholder="Nhập giá khuyến mãi"
            formatter={(value) =>
              value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
            }
            parser={(value) => Number(value?.replace(/\./g, '') || 0)}
            onChange={(val) =>
              handleValueChange(productId, record.id, 'price', val || 0, record)
            }
          />
        );
      },
    },
    {
      title: 'Số lượng giới hạn',
      key: 'limit_quantity',
      render: (_: any, record: any) => {
        const selectedItem = selected.find(
          (p) => p.product_id === productId && p.variant_id === record.id
        );

        return (
          <InputNumber<number>
            min={1}
            style={{ width: '100%' }}
            value={
              formValues[record.id]?.limit_quantity ??
              record.flash_sale_limit ??
              0
            }
            placeholder="Nhập số lượng"
            formatter={(value) =>
              value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : ''
            }
            parser={(value) => Number(value?.replace(/\./g, '') || 0)}
            onChange={(val) =>
              handleValueChange(
                productId,
                record.id,
                'limit_quantity',
                val || 0,
                record
              )
            }
          />
        );
      },
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 80,
      align: 'center' as const, // ✅ fix: chỉ rõ align kiểu hợp lệ
      render: (_: any, record: any) => (
        <Button
          icon={<DeleteOutlined />}
          danger
          onClick={() => {
            handleValueChange(productId, record.id, 'price', 0);
            handleValueChange(productId, record.id, 'limit_quantity', 0);
            message.info(`Đã reset ${record.variant_name || 'sản phẩm'}`);
          }}
        />
      ),
    },
  ];

  return (
    <Card
      title={
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
            Quay lại
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            Đăng ký Flash Sale #{scheduleId}
          </Title>
        </Space>
      }
      bordered={false}
      style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
    >
      {products.length === 0 ? (
        <Empty description="Không có sản phẩm khả dụng" />
      ) : (
        <Collapse accordion>
          {products.map((product) => (
            <Panel
              header={
                <Space>
                  <ThunderboltOutlined style={{ color: '#faad14' }} />
                  <Text strong>{product.name}</Text>
                </Space>
              }
              key={product.id}
            >
              <Table
                columns={columns(product.id)}
                dataSource={product.variants}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </Panel>
          ))}
        </Collapse>
      )}

      <Divider />

      <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
        <Button
          type="primary"
          size="large"
          loading={loading}
          onClick={handleSubmit}
          disabled={selected.length === 0}
        >
          Đăng ký Flash Sale
        </Button>
      </Space>
    </Card>
  );
};

export default FlashSaleRegister;
