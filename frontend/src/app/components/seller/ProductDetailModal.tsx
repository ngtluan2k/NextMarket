import React from 'react';
import { Modal, Button, Tag, Table, Typography } from 'antd';

const { Text, Title } = Typography;

export interface ProductDetail {
  key: string;
  id: string;
  name: string;
  category: string;
  base_price: number;
  brandId?: number; // giữ để tương thích
  brandName?: string; // dùng để hiển thị
  stock: number;
  sold: number;
  revenue: number;
  status: 'Còn Hàng' | 'Sắp Hết Hàng' | 'Hết Hàng';
  statusApi: 'active' | 'draft';
  image: string;
  sku: string;
  short_description: string;
  description: string;
  tags: string[];
  createdAt: string;
  categories: { id: number; name: string }[];
  media: {
    media_type: string;
    url: string;
    is_primary?: boolean;
    sort_order?: number;
  }[];
  variants: {
    id?: number;
    sku: string;
    variant_name: string;
    price: number;
    stock: number;
    barcode?: string;
    inventories?: {
      id?: number;
      location: string;
      quantity: number;
      used_quantity?: number;
    }[];
  }[];
  pricing_rules: {
    type: string;
    min_quantity: number;
    price: number;
    cycle?: string;
    starts_at?: string | Date;
    ends_at?: string | Date;
    limit_quantity?: number;
  }[];
  apiId?: number;
}

type Props = {
  product: ProductDetail | null;
  open?: boolean; // optional: có thể truyền hoặc dựa theo product !== null
  onClose: () => void;
  onEdit?: (p: ProductDetail) => void;
};

function formatVND(n: number) {
  try {
    return n.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    });
  } catch {
    return `${n}₫`;
  }
}

const ProductDetailModal: React.FC<Props> = ({
  product,
  open,
  onClose,
  onEdit,
}) => {
  const isOpen = typeof open === 'boolean' ? open : !!product;

  const mainImage =
    product?.media?.find((m) => m.is_primary && m.media_type === 'image')
      ?.url ||
    product?.image ||
    '/placeholder.svg';

  const gallery = (product?.media || [])
    .filter((m) => m.media_type === 'image' && m.url !== mainImage)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      width={900}
      title={product ? `Chi tiết: ${product.name}` : 'Chi tiết sản phẩm'}
      footer={[
        product && onEdit ? (
          <Button key="edit" type="primary" onClick={() => onEdit(product)}>
            Chỉnh sửa
          </Button>
        ) : null,
        <Button key="close" onClick={onClose}>
          Đóng
        </Button>,
      ].filter(Boolean)}
      destroyOnClose
    >
      {!product ? null : (
        <div className="space-y-4">
          {/* Top: Ảnh + info nhanh */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <div className="w-full aspect-square rounded-lg border overflow-hidden bg-white">
                {/* eslint-disable-next-line jsx-a11y/alt-text */}
                <img
                  src={mainImage}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      '/placeholder.svg';
                  }}
                />
              </div>

              {gallery.length > 0 && (
                <div className="mt-3 grid grid-cols-5 gap-2">
                  {gallery.slice(0, 10).map((m, i) => (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <img
                      key={`${m.url}-${i}`}
                      src={m.url}
                      className="w-full aspect-square object-cover rounded border"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.visibility =
                          'hidden';
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Title level={4} style={{ margin: 0 }}>
                {product.name}
              </Title>
              <div className="text-gray-600">
                {product.short_description || '—'}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <Text type="secondary">SKU:</Text>{' '}
                  <Text strong>{product.sku}</Text>
                </div>
                <div>
                  <Text type="secondary">Danh mục:</Text>{' '}
                  <Text strong>{product.category || 'Chung'}</Text>
                </div>
                <div>
                  <Text type="secondary">Giá gốc:</Text>{' '}
                  <Text strong>{formatVND(product.base_price)}</Text>
                </div>
                <div>
                  <Text type="secondary">Tồn kho:</Text>{' '}
                  <Text strong>{product.stock}</Text>
                </div>

                <div>
                  <Text type="secondary">Thương hiệu:</Text>{' '}
                  <Text strong>
                    {product.brandName?.trim()
                      ? product.brandName
                      : product.brandId
                      ? `#${product.brandId}`
                      : '—'}
                  </Text>
                </div>

                <div>
                  <Text type="secondary">Trạng thái:</Text>{' '}
                  <Tag
                    color={
                      product.status === 'Còn Hàng'
                        ? 'green'
                        : product.status === 'Sắp Hết Hàng'
                        ? 'orange'
                        : 'red'
                    }
                  >
                    {product.status}
                  </Tag>
                </div>
                <div>
                  <Text type="secondary">Tình trạng:</Text>{' '}
                  <Tag
                    color={product.statusApi === 'active' ? 'blue' : 'default'}
                  >
                    {product.statusApi}
                  </Tag>
                </div>
                <div>
                  <Text type="secondary">Ngày tạo:</Text>{' '}
                  <Text>{product.createdAt}</Text>
                </div>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="mt-4">
            <Title level={5}>Biến thể</Title>
            <Table
              size="small"
              rowKey={(r) => (r as any).id ?? (r as any).sku}
              dataSource={product.variants || []}
              pagination={false}
              columns={[
                { title: 'SKU', dataIndex: 'sku', key: 'sku' },
                {
                  title: 'Tên biến thể',
                  dataIndex: 'variant_name',
                  key: 'variant_name',
                },
                {
                  title: 'Giá',
                  dataIndex: 'price',
                  key: 'price',
                  render: (v: number) => formatVND(v),
                },
                { title: 'Tồn kho', dataIndex: 'stock', key: 'stock' },
                {
                  title: 'Barcode',
                  dataIndex: 'barcode',
                  key: 'barcode',
                  render: (v: string) => v || '—',
                },
              ]}
            />
          </div>

          {/* Pricing rules */}
          {(product.pricing_rules || []).length > 0 && (
            <div className="mt-4">
              <Title level={5}>Bảng giá / Quy tắc giá</Title>
              <Table
                size="small"
                rowKey={(_, i) => String(i)}
                dataSource={product.pricing_rules}
                pagination={false}
                columns={[
                  { title: 'Loại', dataIndex: 'type', key: 'type' },
                  {
                    title: 'SL tối thiểu',
                    dataIndex: 'min_quantity',
                    key: 'min_quantity',
                  },
                  {
                    title: 'Giá',
                    dataIndex: 'price',
                    key: 'price',
                    render: (v: number) => formatVND(v),
                  },
                  {
                    title: 'Chu kỳ',
                    dataIndex: 'cycle',
                    key: 'cycle',
                    render: (v: string) => v || '—',
                  },
                  {
                    title: 'Từ ngày',
                    dataIndex: 'starts_at',
                    key: 'starts_at',
                    render: (v: any) => (v ? String(v).split('T')[0] : '—'),
                  },
                  {
                    title: 'Đến ngày',
                    dataIndex: 'ends_at',
                    key: 'ends_at',
                    render: (v: any) => (v ? String(v).split('T')[0] : '—'),
                  },
                ]}
              />
            </div>
          )}

          {/* Description */}
          <div className="mt-4">
            <Title level={5}>Mô tả</Title>
            <div
              className="prose max-w-none"
              dangerouslySetInnerHTML={{
                __html: product.description || '<p>—</p>',
              }}
            />
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ProductDetailModal;
