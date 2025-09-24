// src/components/ProductFormWizard.tsx
import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Space,
  Divider,
  Typography,
  message,
  Switch,
  DatePicker,
  Card,
  Steps,
  FormInstance,
} from 'antd';

import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

type Media = { media_type: string; file?: File; is_primary?: boolean };
type Variant = { sku: string; variant_name: string; price: number; stock: number; barcode?: string };
type Inventory = { variant_sku: string; location: string; quantity: number };
type PricingRule = { type: string; min_quantity: number; price: number; cycle?: string; starts_at?: string; ends_at?: string };

type FormValues = {
  name: string;
  short_description?: string;
  description?: string;
  base_price: number;
  brandId: number;
  categories: number[];
  media: Media[];
  variants: Variant[];
  inventory: Inventory[];
  pricing_rules: PricingRule[];
};

type Props = {
  brands?: { id: number; name: string }[];
  categories?: { id: number; name: string }[];
  onClose?: () => void;
  onCreated?: () => void;
};

export const ProductFormWizard: React.FC<Props> = ({ brands: brandsProp = [], categories: categoriesProp = [], onClose, onCreated }) => {
  const [form] = Form.useForm<FormValues>();
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [brands, setBrands] = useState(brandsProp);
  const [categories, setCategories] = useState(categoriesProp);

  const steps = ['Thông tin', 'Media', 'Biến thể', 'Tồn kho', 'Pricing Rules', 'Xem lại & Tạo'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!brandsProp.length) {
      fetch('http://localhost:3000/brands', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => setBrands(data.data || []))
        .catch(() => setBrands([]));
    }
    if (!categoriesProp.length) {
      fetch('http://localhost:3000/categories', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => setCategories(data.data || []))
        .catch(() => setCategories([]));
    }
  }, []);

  const goNext = () => setCurrent((c) => Math.min(c + 1, steps.length - 1));
  const goPrev = () => setCurrent((c) => Math.max(c - 1, 0));

  const makePrimary = (idx: number) => {
    const media = form.getFieldValue('media') || [];
    const next = media.map((m: any, i: number) => ({ ...m, is_primary: i === idx }));
    form.setFieldsValue({ media: next });
  };

  const handleCreate = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('base_price', String(values.base_price));
      formData.append('brandId', String(values.brandId));
      formData.append('categories', JSON.stringify(values.categories));
      formData.append('variants', JSON.stringify(values.variants || []));
      formData.append('inventory', JSON.stringify(values.inventory || []));
      formData.append('pricing_rules', JSON.stringify(values.pricing_rules || []));
      (values.media || []).forEach((m: any) => { if (m.file) formData.append('media', m.file); });

      const res = await fetch('http://localhost:3000/products/publish', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');
      message.success('Tạo sản phẩm thành công');
      onCreated?.();
      onClose?.();
    } catch (err: any) {
      message.error(err?.message || 'Lỗi tạo sản phẩm');
    } finally {
      setSubmitting(false);
    }
  };

  // const formValues = form.getFieldsValue();
  const formValues = Form.useWatch([], form);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Steps current={current} items={steps.map((s) => ({ title: s }))} style={{ marginBottom: 16 }} />

      <Form
        form={form}
        layout="vertical"
        initialValues={{
          name: '',
          short_description: '',
          description: '',
          base_price: 0,
          brandId: 0,
          categories: [],
          media: [],
          variants: [],
          inventory: [],
          pricing_rules: [],
        }}
      >
        {/* Step 0: Info */}
        {current === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="name" label="Tên sản phẩm" rules={[{ required: true }]}>
              <Input placeholder="Tên sản phẩm" />
            </Form.Item>
            <Form.Item name="brandId" label="Thương hiệu" rules={[{ required: true }]}>
              <Select placeholder="Chọn thương hiệu">{brands.map((b) => <Option key={b.id} value={b.id}>{b.name}</Option>)}</Select>
            </Form.Item>
            <Form.Item name="short_description" label="Mô tả ngắn"><Input /></Form.Item>
            <Form.Item name="base_price" label="Giá cơ bản" rules={[{ required: true }]}><InputNumber min={0} className="w-full" /></Form.Item>
            <Form.Item name="categories" label="Danh mục"><Select mode="multiple">{categories.map((c) => <Option key={c.id} value={c.id}>{c.name}</Option>)}</Select></Form.Item>
            <Form.Item name="description" label="Mô tả"><Input.TextArea rows={4} /></Form.Item>
          </div>
        )}

        {/* Step 1: Media */}
        {current === 1 && (
          <Form.List name="media">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card key={key} size="small" className="mb-3" title={`Media #${name + 1}`} extra={<Button type="link" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)}>Xóa</Button>}>
                    <Form.Item {...rest} name={[name, 'file']} label="Chọn file" valuePropName="file" getValueFromEvent={(e) => e?.target?.files?.[0]} rules={[{ required: true }]}>
                      <input type="file" accept="image/*" />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'is_primary']} label="Primary" valuePropName="checked">
                      <Switch checked={!!formValues.media?.[name]?.is_primary} onChange={(v) => v && makePrimary(name)} />
                    </Form.Item>
                    <Form.Item hidden {...rest} name={[name, 'media_type']} initialValue="image"><Input /></Form.Item>
                  </Card>
                ))}
                <Button icon={<PlusOutlined />} onClick={() => add({ media_type: 'image' })}>Thêm Media</Button>
              </>
            )}
          </Form.List>
        )}

        {/* Step 2: Variants */}
        {current === 2 && (
          <Form.List name="variants">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card key={key} size="small" className="mb-3" title={`Variant #${name + 1}`} extra={<Button type="link" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)}>Xóa</Button>}>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <Form.Item {...rest} name={[name, 'sku']} label="SKU" rules={[{ required: true }]}><Input /></Form.Item>
                      <Form.Item {...rest} name={[name, 'variant_name']} label="Tên biến thể"><Input /></Form.Item>
                      <Form.Item {...rest} name={[name, 'price']} label="Giá"><InputNumber min={0} className="w-full" /></Form.Item>
                      <Form.Item label="Tồn"><InputNumber disabled value={formValues.inventory?.filter((i: any) => i.variant_sku === form.getFieldValue(['variants', name, 'sku']))?.reduce((s, i) => s + i.quantity, 0) || 0} /></Form.Item>
                      <Form.Item {...rest} name={[name, 'barcode']} label="Barcode"><Input /></Form.Item>
                    </div>
                  </Card>
                ))}
                <Button icon={<PlusOutlined />} onClick={() => add({ price: 0, stock: 0 })}>Thêm biến thể</Button>
              </>
            )}
          </Form.List>
        )}

        {/* Step 3: Inventory */}
        {current === 3 && (
          <Form.List name="inventory">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card key={key} size="small" className="mb-3" title={`Inventory #${name + 1}`} extra={<Button type="link" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)}>Xóa</Button>}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Form.Item {...rest} name={[name, 'variant_sku']} label="Variant SKU" rules={[{ required: true }]}><Input /></Form.Item>
                      <Form.Item {...rest} name={[name, 'location']} label="Vị trí kho"><Input /></Form.Item>
                      <Form.Item {...rest} name={[name, 'quantity']} label="Số lượng" rules={[{ required: true }]}><InputNumber min={0} className="w-full" /></Form.Item>
                    </div>
                  </Card>
                ))}
                <Button icon={<PlusOutlined />} onClick={() => add({ quantity: 0 })}>Thêm tồn kho</Button>
              </>
            )}
          </Form.List>
        )}

        {/* Step 4: Pricing Rules */}
        {current === 4 && (
          <Form.List name="pricing_rules">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card key={key} size="small" className="mb-3" title={`Rule #${name + 1}`} extra={<Button type="link" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)}>Xóa</Button>}>
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <Form.Item {...rest} name={[name, 'type']} label="Loại"><Input /></Form.Item>
                      <Form.Item {...rest} name={[name, 'min_quantity']} label="Min Qty"><InputNumber min={0} className="w-full" /></Form.Item>
                      <Form.Item {...rest} name={[name, 'price']} label="Giá"><InputNumber min={0} className="w-full" /></Form.Item>
                      <Form.Item {...rest} name={[name, 'cycle']} label="Chu kỳ"><Input /></Form.Item>
                      <Form.Item {...rest} name={[name, 'starts_at']} label="Bắt đầu"><DatePicker className="w-full" /></Form.Item>
                      <Form.Item {...rest} name={[name, 'ends_at']} label="Kết thúc"><DatePicker className="w-full" /></Form.Item>
                    </div>
                  </Card>
                ))}
                <Button icon={<PlusOutlined />} onClick={() => add({})}>Thêm rule</Button>
              </>
            )}
          </Form.List>
        )}

        {/* Step 5: Review */}
        {current === 5 && (
          <div className="space-y-4">
            <Title level={5}>Xem lại</Title>
            <div><Text strong>Tên:</Text> {formValues.name || '—'}</div>
            <div><Text strong>Brand:</Text> {brands.find((b) => b.id === formValues.brandId)?.name || '—'}</div>
            <div><Text strong>Giá cơ bản:</Text> {formValues.base_price || 0}</div>
            <div><Text strong>Danh mục:</Text> {(formValues.categories || []).map((id) => categories.find((c) => c.id === id)?.name).filter(Boolean).join(', ') || '—'}</div>
            <div><Text strong>Media:</Text> {(formValues.media || []).length}</div>
            <div><Text strong>Variants:</Text> {(formValues.variants || []).length}</div>
            <div><Text strong>Inventory:</Text> {(formValues.inventory || []).length}</div>
            <div><Text strong>Pricing rules:</Text> {(formValues.pricing_rules || []).length}</div>
          </div>
        )}

      </Form>

      <Divider />

      <div className="flex justify-between">
        <Space><Button onClick={onClose}>Hủy</Button></Space>
        <Space>
          {current > 0 && <Button onClick={goPrev}>Quay lại</Button>}
          {current < steps.length - 1
            ? <Button type="primary" onClick={goNext}>Tiếp tục</Button>
            : <Button type="primary" loading={submitting} onClick={handleCreate}>Tạo sản phẩm</Button>
          }
        </Space>
      </div>
    </div>
  );
};
