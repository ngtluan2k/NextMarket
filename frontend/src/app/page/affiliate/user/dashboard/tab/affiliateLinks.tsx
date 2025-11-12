import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Tabs,
  Card,
  Button,
  Form,
  Table,
  Space,
  Tag,
  message,
  Popconfirm,
  Typography,
  Divider,
  Alert,
  Select,
  Modal,
  QRCode,
  Input,
} from 'antd';
import {
  AffiliatedProduct,
  CreateLinkRequest,
  MyLink,
  Program,
} from "../../../../../types/affiliate-links";
import { getAllProducts, ProductOption, VariantOption } from "../../../../../../service/product-helper.service";
import { productService, Product } from '../../../../../../service/product.service';
import { createLink, deleteLink, getMyAffiliatedProducts, getMyLinks, getPrograms } from '../../../../../../service/afiliate/affiliate-links.service';

const { Title, Text } = Typography;

export default function AffiliateLinks() {
  const [msg, ctx] = message.useMessage();
  const [loading, setLoading] = useState(false);

  // danh sách
  const [myLinks, setMyLinks] = useState<MyLink[]>([]);
  const [affiliatedProducts, setAffiliatedProducts] = useState<AffiliatedProduct[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | undefined>();
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>();
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  // sharing modal state
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [shareRecord, setShareRecord] = useState<MyLink | null>(null);

  // form tạo liên kết
  const [form] = Form.useForm<CreateLinkRequest>();

  const token = useMemo(() => localStorage.getItem('token') || '', []);
  const affiliateCode = useMemo(
    () => localStorage.getItem('affiliate_code') || '',
    []
  );


  const ensureUrl = useCallback(
    (link: MyLink): string => {
      const raw = (link.affiliate_link || '').trim();
      const baseIfMissing =
        link.productId != null
          ? `${window.location.origin}/product/${link.productId}`
          : '';
      const base = raw || baseIfMissing;
      if (!base) return '';
      const enforcedOrigin = base.replace(
        /^https?:\/\/[^/]+/i,
        window.location.origin
      );
      let url: URL;
      try {
        url = new URL(enforcedOrigin, window.location.origin);
      } catch {
        return '';
      }
      if (!url.searchParams.get('aff') && affiliateCode) {
        url.searchParams.set('aff', affiliateCode);
      }
      if (!url.searchParams.get('variant') && typeof link.variantId === 'number') {
        url.searchParams.set('variant', String(link.variantId));
      }
      if (!url.searchParams.get('program') && typeof link.programId === 'number') {
        url.searchParams.set('program', String(link.programId));
      }
      return url.toString();
    },
    [affiliateCode]
  );

  const copyToClipboard = useCallback(
    async (text: string) => {
      const value = (text || '').trim();
      if (!value) {
        msg.warning('Liên kết tiếp thị chưa sẵn sàng');
        return;
      }
      try {
        await navigator.clipboard.writeText(value);
        msg.success('Đã sao chép liên kết tiếp thị');
      } catch {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = value;
          textarea.style.position = 'fixed';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          msg.success('Đã sao chép liên kết tiếp thị');
        } catch {
          msg.error('Không thể sao chép liên kết');
        }
      }
    },
    [msg]
  );

  const openInNewTab = (url: string) => {
    const href = (url || '').trim();
    if (!href) return;
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const handleShare = useCallback((record: MyLink) => {
    const url = ensureUrl(record);
    if (!url) {
      msg.warning('Liên kết chưa sẵn sàng để chia sẻ');
      return;
    }
    setShareLink(url);
    setShareRecord(record);
    setShareModalVisible(true);
  }, [ensureUrl, msg]);

  const loadProducts = useCallback(async () => {
    try {
      const prods = await getAllProducts();
      setProducts(prods);
    } catch (error) {
      console.error('Không thể tải danh sách sản phẩm:', error);
    }
  }, []);

  const loadProductDetail = useCallback(async (productId: number) => {
    try {
      const detail = await productService.getProductById(productId);
      setProductDetail(detail);
    } catch (error) {
      console.error('Không thể tải chi tiết sản phẩm:', error);
      setProductDetail(null);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [links, affiliatedProds, progs] = await Promise.all([
        getMyLinks(),
        getMyAffiliatedProducts(),
        getPrograms(),
      ]);
      setMyLinks(links);
      setAffiliatedProducts(affiliatedProds);
      setPrograms(progs);
    } catch (e: any) {
      msg.error(e?.message || 'Không thể tải dữ liệu liên kết tiếp thị');
    } finally {
      setLoading(false);
    }
  }, [getMyAffiliatedProducts, getMyLinks, getPrograms, msg]);

  useEffect(() => {
    refreshAll();
    loadProducts();
  }, [refreshAll, loadProducts]);

  const handleCreateLink = useCallback(
    async (values: CreateLinkRequest) => {
      setLoading(true);
      try {
        const payload: CreateLinkRequest = {
          productId: Number(values.productId),
          variantId:
            typeof values.variantId === 'number' &&
            !Number.isNaN(values.variantId)
              ? values.variantId
              : undefined,
          programId:
            typeof (values as any).programId === 'number' &&
            !Number.isNaN((values as any).programId)
              ? (values as any).programId
              : undefined,
        };
        const created = await createLink(payload);
        msg.success('Đã tạo liên kết tiếp thị');
        await refreshAll();
        if (created?.affiliate_link) {
          copyToClipboard(created.affiliate_link);
        }
        form.resetFields();
      } catch (e: any) {
        // Don't show additional error message if it's rate limit (already handled in service)
        if (e?.message !== 'RATE_LIMIT_EXCEEDED') {
          msg.error(e?.message || 'Tạo liên kết thất bại');
        }
      } finally {
        setLoading(false);
      }
    },
    [copyToClipboard, form, msg, createLink, refreshAll]
  );

  const myLinksColumns = useMemo(
    () => [
      {
        title: 'Chương trình',
        dataIndex: 'program_name',
        key: 'program_name',
        render: (v: string) =>
          v ? <Tag color="blue">{v}</Tag> : <Tag>Không xác định</Tag>,
      },
      {
        title: 'ID sản phẩm',
        dataIndex: 'productId',
        key: 'productId',
        render: (v: number | undefined) => (typeof v === 'number' ? v : '—'),
      },
      {
        title: 'Biến thể',
        dataIndex: 'variantId',
        key: 'variantId',
        render: (v: number | undefined) => (typeof v === 'number' ? v : '—'),
      },
      {
        title: 'Liên kết tiếp thị',
        key: 'link',
        render: (_: unknown, record: MyLink) => {
          const url = ensureUrl(record);
          const disabled = !url;
          return (
            <Space>
              <span
                style={{
                  maxWidth: 480,
                  display: 'inline-block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={url || 'Liên kết chưa sẵn sàng'}
              >
                {disabled ? 'Liên kết chưa sẵn sàng' : url}
              </span>
              <Button
                type="primary"
                disabled={disabled}
                onClick={() => copyToClipboard(url)}
              >
                Sao chép
              </Button>
              <Button disabled={disabled} onClick={() => openInNewTab(url)}>
                Mở
              </Button>
            </Space>
          );
        },
      },
      {
        title: 'Ngày tạo',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (v: string | undefined) =>
          v ? new Date(v).toLocaleString() : '—',
      },
      {
        title: 'Thao tác',
        key: 'actions',
        render: (_: unknown, record: MyLink) => (
          <Space>
            <Button 
              type="default" 
              onClick={() => handleShare(record)}
              disabled={!ensureUrl(record)}
            >
              Chia sẻ QR
            </Button>
            <Popconfirm
              title="Xóa liên kết tiếp thị này?"
              onConfirm={async () => {
                try {
                  await deleteLink(record.link_id);
                  msg.success('Đã xóa liên kết');
                  await refreshAll();
                } catch (e: any) {
                  msg.error(e?.message || 'Xóa thất bại');
                }
              }}
            >
              <Button danger>Xóa</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [copyToClipboard, deleteLink, ensureUrl, handleShare, msg, refreshAll]
  );

  const productsColumns = useMemo(
    () => [
      {
        title: 'Sản phẩm',
        key: 'product',
        render: (record: any) => (
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {record.media && record.media.length > 0 ? (
              <img
                src={record.media[0].url}
                alt={record.name}
                style={{
                  width: '60px',
                  height: '60px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                }}
              />
            ) : (
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text type="secondary">Không có ảnh</Text>
              </div>
            )}
            <div>
              <div style={{ fontWeight: 500 }}>{record.name || '—'}</div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                ID: {record.id}
              </Text>
            </div>
          </div>
        ),
      },
      {
        title: 'Cửa hàng',
        key: 'store',
        render: (record: any) => (
          <Text>{record.store?.name || '—'}</Text>
        ),
      },
      {
        title: 'Biến thể',
        key: 'variants',
        render: (record: any) => (
          <Text>
            {record.variants && record.variants.length > 0
              ? record.variants.length
              : '0'}
          </Text>
        ),
      },
      {
        title: 'Giá',
        key: 'price',
        render: (record: any) => (
          <Text>
            {record.base_price
              ? `VND ${Number(record.base_price).toFixed(2)}`
              : '—'}
          </Text>
        ),
      },
      {
        title: 'Ngày tạo',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (v: string | undefined) =>
          v ? new Date(v).toLocaleString() : '—',
      },
    ],
    []
  );

  return (
    <>
      {ctx}
      {!token && (
        <Alert
          type="warning"
          showIcon
          message="Bạn chưa đăng nhập"
          description="Vui lòng đăng nhập để quản lý liên kết tiếp thị."
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            Tạo liên kết tiếp thị
          </Title>
        }
        style={{ marginBottom: 16 }}
      >
        <Form
          form={form}
          layout="inline"
          onFinish={handleCreateLink}
          initialValues={{
            productId: undefined,
            variantId: undefined,
            programId: undefined,
          }}
        >
          <Form.Item
            label="Chương trình"
            name="programId"
            rules={[{ required: true, message: 'Vui lòng chọn một chương trình' }]}
          >
            <Select
              placeholder="Chọn chương trình"
              style={{ minWidth: 220 }}
              loading={loading && programs.length === 0}
              options={programs.map((p) => ({
                value: p.id,
                label: p.name + (p.status ? ` (${p.status})` : ''),
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Sản phẩm"
            name="productId"
            rules={[{ required: true, message: 'Vui lòng chọn sản phẩm' }]}
          >
            <Select
              placeholder="Chọn sản phẩm"
              style={{ minWidth: 250 }}
              loading={loading && products.length === 0}
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              onChange={(value) => {
                setSelectedProduct(value);
                setSelectedVariant(undefined);
                setSelectedVariantId(undefined);
                form.setFieldsValue({ variantId: undefined });
                if (value) {
                  loadProductDetail(value);
                }
              }}
              options={products.map((p) => ({
                value: p.id,
                label: p.name,
              }))}
            />
          </Form.Item>

          <Form.Item 
            label="Biến thể" 
            name="variantId"
          >
            <Select
              placeholder="Chọn biến thể (không bắt buộc)"
              style={{ minWidth: 250 }}
              disabled={!selectedProduct}
              allowClear
              onChange={(value) => {
                setSelectedVariantId(value);
                if (value && productDetail) {
                  const variant = productDetail.variants?.find(v => v.id === value);
                  setSelectedVariant(variant || null);
                } else {
                  setSelectedVariant(null);
                }
              }}
              options={
                products
                  .find((p) => p.id === selectedProduct)
                  ?.variants?.map((v) => ({
                    value: v.id,
                    label: v.variant_name || v.sku,
                  })) || []
              }
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!token}
            >
              Tạo liên kết
            </Button>
          </Form.Item>
        </Form>
        <Divider style={{ margin: '12px 0' }} />
        <Text type="secondary">
          Việc chọn chương trình được áp dụng khi tạo liên kết. Liên kết sẽ được chuẩn hóa theo origin hiện tại của bạn và sẽ tự bổ sung tham số aff/variant nếu còn thiếu khi có thể.
        </Text>
      </Card>

      {productDetail && (
        <Card
          title={
            <Title level={4} style={{ margin: 0 }}>
              Xem trước sản phẩm
            </Title>
          }
          style={{ marginBottom: 16 }}
        >
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            {productDetail.media && productDetail.media.length > 0 && (
              <img
                src={productDetail.media[0].url}
                alt={productDetail.name}
                style={{
                  width: '200px',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <Title level={5}>{productDetail.name}</Title>
              <Text type="secondary">
                {productDetail.short_description || productDetail.description}
              </Text>
              <div style={{ marginTop: '12px' }}>
                <Space direction="vertical" size="small">
                  <div>
                    <Text strong>Thương hiệu: </Text>
                    {productDetail.brand?.name || 'N/A'}
                  </div>
                  <div>
                    <Text strong>Cửa hàng: </Text>
                    {productDetail.store?.name || 'N/A'}
                  </div>
                  {selectedVariant ? (
                    <>
                      <div>
                        <Text strong>Biến thể: </Text>
                        {selectedVariant.variant_name} (SKU: {selectedVariant.sku})
                      </div>
                      <div>
                        <Text strong>Giá: </Text>
                        <Text style={{ fontSize: '18px', color: '#1890ff' }}>
                          VND {Number(selectedVariant.price).toFixed(2)}
                        </Text>
                      </div>
                      <div>
                        <Text strong>Tồn kho: </Text>
                        {selectedVariant.stock}
                      </div>
                    </>
                  ) : (
                    <div>
                      <Text strong>Giá cơ bản: </Text>
                      <Text style={{ fontSize: '18px', color: '#1890ff' }}>
                        {productDetail.base_price ? `VND ${Number(productDetail.base_price).toFixed(2)}` : 'N/A'}
                      </Text>
                    </div>
                  )}
                </Space>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Tabs
        items={[
          {
            key: 'my-links',
            label: 'Liên kết của tôi',
            children: (
              <Table
                rowKey={(r) => String(r.link_id)}
                loading={loading}
                dataSource={myLinks}
                columns={myLinksColumns as any}
                pagination={{ pageSize: 10 }}
              />
            ),
          },
          {
            key: 'affiliated-products',
            label: 'Sản phẩm liên kết',
            children: (
              <Table
                rowKey={(r) => String(r.id)}
                loading={loading}
                dataSource={affiliatedProducts}
                columns={productsColumns as any}
                pagination={{ pageSize: 10 }}
              />
            ),
          },
        ]}
      />

      {/* Sharing Modal with QR Code */}
      <Modal
        title="Chia sẻ liên kết affiliate"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setShareModalVisible(false)}>
            Đóng
          </Button>,
          <Button 
            key="copy" 
            type="primary" 
            onClick={() => copyToClipboard(shareLink)}
          >
            Sao chép liên kết
          </Button>
        ]}
        width={600}
      >
        {shareRecord && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '20px' }}>
              <Text strong>Sản phẩm: </Text>
              <Text>ID {shareRecord.productId}</Text>
              {shareRecord.variantId && (
                <>
                  <Text strong> - Biến thể: </Text>
                  <Text>{shareRecord.variantId}</Text>
                </>
              )}
            </div>
            
            {/* QR Code */}
            <div style={{ marginBottom: '20px' }}>
              <QRCode
                value={shareLink}
                size={200}
                style={{ margin: '0 auto' }}
              />
            </div>
            
            {/* Link Input */}
            <div style={{ marginBottom: '10px' }}>
              <Text strong>Liên kết affiliate:</Text>
            </div>
            <Input.TextArea
              value={shareLink}
              readOnly
              rows={3}
              style={{ 
                fontFamily: 'monospace', 
                fontSize: '12px',
                marginBottom: '10px'
              }}
            />
            
            <Alert
              message="Hướng dẫn chia sẻ"
              description={
                <div>
                  <p>• <strong>QR Code:</strong> Chụp ảnh màn hình hoặc lưu QR code để chia sẻ trực tiếp</p>
                  <p>• <strong>Liên kết:</strong> Sao chép và chia sẻ qua tin nhắn, email, mạng xã hội</p>
                  <p>• Khi khách hàng mua qua liên kết này, bạn sẽ nhận được hoa hồng</p>
                </div>
              }
              type="info"
              showIcon
            />
          </div>
        )}
      </Modal>
    </>
  );
}