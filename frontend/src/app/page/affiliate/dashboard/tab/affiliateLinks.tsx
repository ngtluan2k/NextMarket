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
} from 'antd';
import {
  AffiliatedProduct,
  AffiliatedProductsResponse,
  CreateLinkRequest,
  CreateLinkResponse,
  MyLink,
  MyLinksResponse,
  Program,
  ProgramsResponse,
} from '../../../../types/affiliate-links';
import { getAllProducts, ProductOption, VariantOption } from '../../../../../service/product-helper.service';
import { productService, Product } from '../../../../../service/product.service';

const { Title, Text } = Typography;
const API_BASE = 'http://localhost:3000';

export default function AffiliateLinks() {
  const [msg, ctx] = message.useMessage();
  const [loading, setLoading] = useState(false);

  // lists
  const [myLinks, setMyLinks] = useState<MyLink[]>([]);
  const [affiliatedProducts, setAffiliatedProducts] = useState<
    AffiliatedProduct[]
  >([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<number | undefined>();
  const [productDetail, setProductDetail] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<number | undefined>();
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  // create form
  const [form] = Form.useForm<CreateLinkRequest>();

  const token = useMemo(() => localStorage.getItem('token') || '', []);
  const affiliateCode = useMemo(
    () => localStorage.getItem('affiliate_code') || '',
    []
  );

  const authHeaders = useMemo(
    () => ({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    }),
    [token]
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
      if (
        !url.searchParams.get('variant') &&
        typeof link.variantId === 'number'
      ) {
        url.searchParams.set('variant', String(link.variantId));
      }
      return url.toString();
    },
    [affiliateCode]
  );

  const copyToClipboard = useCallback(
    async (text: string) => {
      const value = (text || '').trim();
      if (!value) {
        msg.warning('Affiliate link is not ready yet');
        return;
      }
      try {
        await navigator.clipboard.writeText(value);
        msg.success('Copied affiliate link');
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
          msg.success('Copied affiliate link');
        } catch {
          msg.error('Unable to copy link');
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

  const getMyLinks = useCallback(async () => {
    const res = await fetch(`${API_BASE}/affiliate-links/my-links`, {
      headers: authHeaders,
    });
    if (!res.ok) throw new Error(`Failed to load my links (${res.status})`);
    const json: MyLinksResponse = await res.json();
    return Array.isArray(json?.links) ? json.links : [];
  }, [authHeaders]);

  const getAffiliatedProducts = useCallback(async () => {
    const res = await fetch(`${API_BASE}/affiliate-links/affiliated-products`, {
      headers: authHeaders,
    });
    if (!res.ok)
      throw new Error(`Failed to load affiliated products (${res.status})`);
    const json: AffiliatedProductsResponse = await res.json();
    return (json?.data || json?.products || []) as AffiliatedProduct[];
  }, [authHeaders]);

  const getPrograms = useCallback(async (): Promise<Program[]> => {
    const tryEndpoints = [
      `${API_BASE}/affiliate-programs`,
    ];
    for (const url of tryEndpoints) {
      try {
        const res = await fetch(url, { headers: authHeaders });
        if (!res.ok) continue;
        const data: ProgramsResponse = await res.json();
        const arr = Array.isArray(data) ? data : data?.data || [];
        if (Array.isArray(arr) && arr.length) {
          return arr
            .filter(
              (p: any) =>
                p && typeof p.id === 'number' && typeof p.name === 'string'
            )
            .map((p: any) => ({ id: p.id, name: p.name, status: p.status }));
        }
      } catch (error) {
        console.error('Failed to fetch programs:', error);
      }
    }
    return [];
  }, [authHeaders]);

  const postCreateLink = useCallback(
    async (payload: CreateLinkRequest) => {
      const res = await fetch(`${API_BASE}/affiliate-links/create-link`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Create link failed (${res.status})`);
      const json: CreateLinkResponse = await res.json();
      return json;
    },
    [authHeaders]
  );

  const deleteLink = useCallback(
    async (id: number) => {
      const res = await fetch(`${API_BASE}/affiliate-links/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`Delete link failed (${res.status})`);
      const text = await res.text();
      return text ? JSON.parse(text) : { success: true };
    },
    [authHeaders]
  );

  const loadProducts = useCallback(async () => {
    try {
      const prods = await getAllProducts();
      setProducts(prods);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  }, []);

  const loadProductDetail = useCallback(async (productId: number) => {
    try {
      const detail = await productService.getProductById(productId);
      setProductDetail(detail);
    } catch (error) {
      console.error('Failed to load product detail:', error);
      setProductDetail(null);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [links, affiliatedProds, progs] = await Promise.all([
        getMyLinks(),
        getAffiliatedProducts(),
        getPrograms(),
      ]);
      setMyLinks(links);
      setAffiliatedProducts(affiliatedProds);
      setPrograms(progs);
    } catch (e: any) {
      msg.error(e?.message || 'Failed to load affiliate data');
    } finally {
      setLoading(false);
    }
  }, [getAffiliatedProducts, getMyLinks, getPrograms, msg]);

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
        const created = await postCreateLink(payload);
        msg.success('Affiliate link created');
        await refreshAll();
        if (created?.affiliate_link) {
          copyToClipboard(created.affiliate_link);
        }
        form.resetFields();
      } catch (e: any) {
        msg.error(e?.message || 'Create link failed');
      } finally {
        setLoading(false);
      }
    },
    [copyToClipboard, form, msg, postCreateLink, refreshAll]
  );

  const myLinksColumns = useMemo(
    () => [
      {
        title: 'Program',
        dataIndex: 'program_name',
        key: 'program_name',
        render: (v: string) =>
          v ? <Tag color="blue">{v}</Tag> : <Tag>Unknown</Tag>,
      },
      {
        title: 'Product ID',
        dataIndex: 'productId',
        key: 'productId',
        render: (v: number | undefined) => (typeof v === 'number' ? v : '—'),
      },
      {
        title: 'Variant',
        dataIndex: 'variantId',
        key: 'variantId',
        render: (v: number | undefined) => (typeof v === 'number' ? v : '—'),
      },
      {
        title: 'Affiliate Link',
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
                title={url || 'Link not ready'}
              >
                {disabled ? 'Link not ready' : url}
              </span>
              <Button
                type="primary"
                disabled={disabled}
                onClick={() => copyToClipboard(url)}
              >
                Copy
              </Button>
              <Button disabled={disabled} onClick={() => openInNewTab(url)}>
                Open
              </Button>
            </Space>
          );
        },
      },
      {
        title: 'Created',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (v: string | undefined) =>
          v ? new Date(v).toLocaleString() : '—',
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_: unknown, record: MyLink) => (
          <Space>
            <Popconfirm
              title="Delete this affiliate link?"
              onConfirm={async () => {
                try {
                  await deleteLink(record.link_id);
                  msg.success('Deleted link');
                  await refreshAll();
                } catch (e: any) {
                  msg.error(e?.message || 'Delete failed');
                }
              }}
            >
              <Button danger>Delete</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [copyToClipboard, deleteLink, ensureUrl, msg, refreshAll]
  );

  const productsColumns = useMemo(
    () => [
      {
        title: 'Product',
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
                <Text type="secondary">No Image</Text>
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
        title: 'Store',
        key: 'store',
        render: (record: any) => (
          <Text>{record.store?.name || '—'}</Text>
        ),
      },
      {
        title: 'Variants',
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
        title: 'Price',
        key: 'price',
        render: (record: any) => (
          <Text>
            {record.base_price
              ? `₦${Number(record.base_price).toFixed(2)}`
              : '—'}
          </Text>
        ),
      },
      {
        title: 'Created',
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
          message="You are not logged in"
          description="Please log in to manage affiliate links."
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title={
          <Title level={4} style={{ margin: 0 }}>
            Create Affiliate Link
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
            label="Program"
            name="programId"
            rules={[{ required: true, message: 'Please select a program' }]}
          >
            <Select
              placeholder="Select program"
              style={{ minWidth: 220 }}
              loading={loading && programs.length === 0}
              options={programs.map((p) => ({
                value: p.id,
                label: p.name + (p.status ? ` (${p.status})` : ''),
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Product"
            name="productId"
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select
              placeholder="Select product"
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
            label="Variant" 
            name="variantId"
          >
            <Select
              placeholder="Select variant (optional)"
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
              Create Link
            </Button>
          </Form.Item>
        </Form>
        <Divider style={{ margin: '12px 0' }} />
        <Text type="secondary">
          Program selection applies to link creation. Links are normalized to
          your current origin and will backfill missing aff/variant when
          possible.
        </Text>
      </Card>

      {productDetail && (
        <Card
          title={
            <Title level={4} style={{ margin: 0 }}>
              Product Preview
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
                    <Text strong>Brand: </Text>
                    {productDetail.brand?.name || 'N/A'}
                  </div>
                  <div>
                    <Text strong>Store: </Text>
                    {productDetail.store?.name || 'N/A'}
                  </div>
                  {selectedVariant ? (
                    <>
                      <div>
                        <Text strong>Variant: </Text>
                        {selectedVariant.variant_name} (SKU: {selectedVariant.sku})
                      </div>
                      <div>
                        <Text strong>Price: </Text>
                        <Text style={{ fontSize: '18px', color: '#1890ff' }}>
                          ₦{Number(selectedVariant.price).toFixed(2)}
                        </Text>
                      </div>
                      <div>
                        <Text strong>Stock: </Text>
                        {selectedVariant.stock}
                      </div>
                    </>
                  ) : (
                    <div>
                      <Text strong>Base Price: </Text>
                      <Text style={{ fontSize: '18px', color: '#1890ff' }}>
                        {productDetail.base_price ? `₦${Number(productDetail.base_price).toFixed(2)}` : 'N/A'}
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
            label: 'My Links',
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
            label: 'Affiliated Products',
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
    </>
  );
}
