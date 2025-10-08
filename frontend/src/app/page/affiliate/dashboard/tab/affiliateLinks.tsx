import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Tabs,
  Card,
  Button,
  Form,
  InputNumber,
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
import { AffiliatedProduct, AffiliatedProductsResponse, CreateLinkRequest, CreateLinkResponse, MyLink, MyLinksResponse, Program, ProgramsResponse } from '../../../../types/affiliate-links';


const { Title, Text } = Typography;
const API_BASE = 'http://localhost:3000';

export default function AffiliateLinks() {
  const [msg, ctx] = message.useMessage();
  const [loading, setLoading] = useState(false);

  // lists
  const [myLinks, setMyLinks] = useState<MyLink[]>([]);
  const [affiliatedProducts, setAffiliatedProducts] = useState<AffiliatedProduct[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

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
        link.productId != null ? `${window.location.origin}/product/${link.productId}` : '';
      const base = raw || baseIfMissing;
      if (!base) return '';
      const enforcedOrigin = base.replace(/^https?:\/\/[^/]+/i, window.location.origin);
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
    if (!res.ok) throw new Error(`Failed to load affiliated products (${res.status})`);
    const json: AffiliatedProductsResponse = await res.json();
    return (json?.data || json?.products || []) as AffiliatedProduct[];
  }, [authHeaders]);

  const getPrograms = useCallback(async (): Promise<Program[]> => {
    const tryEndpoints = [
      `${API_BASE}/affiliate-programs/active`,
      `${API_BASE}/affiliate-programs`,
      `${API_BASE}/affiliate-program/active`,
      `${API_BASE}/affiliate-program`,
    ];
    for (const url of tryEndpoints) {
      try {
        const res = await fetch(url, { headers: authHeaders });
        if (!res.ok) continue;
        const data: ProgramsResponse = await res.json();
        const arr = Array.isArray(data) ? data : (data?.data || []);
        if (Array.isArray(arr) && arr.length) {
          return arr
            .filter((p: any) => p && typeof p.id === 'number' && typeof p.name === 'string')
            .map((p: any) => ({ id: p.id, name: p.name, status: p.status }));
        }
      } catch {
        //cho xin 5 chuc
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


  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [links, products, progs] = await Promise.all([
        getMyLinks(),
        getAffiliatedProducts(),
        getPrograms(),
      ]);
      setMyLinks(links);
      setAffiliatedProducts(products);
      setPrograms(progs);
    } catch (e: any) {
      msg.error(e?.message || 'Failed to load affiliate data');
    } finally {
      setLoading(false);
    }
  }, [getAffiliatedProducts, getMyLinks, getPrograms, msg]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);


  const handleCreateLink = useCallback(
    async (values: CreateLinkRequest) => {
      setLoading(true);
      try {
        const payload: CreateLinkRequest = {
          productId: Number(values.productId),
          variantId:
            typeof values.variantId === 'number' && !Number.isNaN(values.variantId)
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
        render: (v: string) => (v ? <Tag color="blue">{v}</Tag> : <Tag>Unknown</Tag>),
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
              <Button type="primary" disabled={disabled} onClick={() => copyToClipboard(url)}>
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
        render: (v: string | undefined) => (v ? new Date(v).toLocaleString() : '—'),
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
      { title: 'ID', dataIndex: 'id', key: 'id' },
      {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        render: (v: string | undefined) => v || '—',
      },
      {
        title: 'Created',
        dataIndex: 'created_at',
        key: 'created_at',
        render: (v: string | undefined) => (v ? new Date(v).toLocaleString() : '—'),
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

      <Card title={<Title level={4} style={{ margin: 0 }}>Create Affiliate Link</Title>} style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleCreateLink}
          initialValues={{ productId: undefined, variantId: undefined, programId: undefined }}
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
            label="Product ID"
            name="productId"
            rules={[{ required: true, message: 'Product ID is required' }]}
          >
            <InputNumber min={1} placeholder="e.g., 4" />
          </Form.Item>

          <Form.Item label="Variant ID" name="variantId">
            <InputNumber min={1} placeholder="optional" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} disabled={!token}>
              Create Link
            </Button>
          </Form.Item>
        </Form>
        <Divider style={{ margin: '12px 0' }} />
        <Text type="secondary">
          Program selection applies to link creation. Links are normalized to your current origin and will backfill missing aff/variant when possible.
        </Text>
      </Card>

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