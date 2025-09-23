// src/modules/products/ProductFormWizard.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  Steps,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Space,
  Divider,
  Typography,
  message,
  Switch,
  DatePicker,
  Card,
} from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import {
  CreateProductDto,
  productService,
} from '../../../service/product.service';

const { Title, Text } = Typography;
const { Option } = Select;

type WizardProps = {
  onClose?: () => void;
  onCreated?: () => void;
  brandsProp?: { id: number; name: string }[];
  categoriesProp?: { id: number; name: string }[];
};

// ❌ Bỏ sort_order như bạn yêu cầu
type Media = { media_type: string; url: string; is_primary?: boolean };
type Variant = {
  sku: string;
  variant_name: string;
  price: number;
  stock: number;
  barcode?: string;
};
type Inventory = {
  variant_sku: string;
  location: string;
  quantity: number;
  used_quantity?: number;
};
type PricingRule = {
  type: string;
  min_quantity: number;
  price: number;
  cycle?: string;
  starts_at?: string;
  ends_at?: string;
};

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

export function ProductFormWizard({
  onClose,
  onCreated,
  brandsProp,
  categoriesProp,
}: WizardProps) {
  const [form] = Form.useForm<FormValues>();
  const [current, setCurrent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    []
  );

  useEffect(() => {
    if (brandsProp?.length) setBrands(brandsProp);
    if (categoriesProp?.length) setCategories(categoriesProp);
  }, [brandsProp, categoriesProp]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!brandsProp) {
      fetch('http://localhost:3000/brands', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) =>
          setBrands(
            (data?.data || []).map((b: any) => ({
              id: Number(b.id),
              name: b.name,
            }))
          )
        )
        .catch(() => setBrands([]));
    }
    if (!categoriesProp) {
      fetch('http://localhost:3000/categories', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) =>
          setCategories(
            (data?.data || []).map((c: any) => ({
              id: Number(c.id),
              name: c.name,
            }))
          )
        )
        .catch(() => setCategories([]));
    }
  }, []);

  const steps = [
    { title: 'Thông tin' },
    { title: 'Media' },
    { title: 'Biến thể' },
    { title: 'Tồn kho' },
    { title: 'Giá / Rule' },
    { title: 'Xem lại & Tạo' },
  ];

  const stepFields: Record<number, (keyof FormValues)[]> = useMemo(
    () => ({
      0: [
        'name',
        'base_price',
        'brandId',
        'categories',
        'description',
        'short_description',
      ],
      1: ['media'],
      2: ['variants'],
      3: ['inventory'],
      4: ['pricing_rules'],
      5: [],
    }),
    []
  );

  const onStepClick = (idx: number) => setCurrent(idx);
  const goNext = () => setCurrent((s) => Math.min(s + 1, steps.length - 1));
  const goPrev = () => setCurrent((s) => Math.max(s - 1, 0));

  const findStepByError = (errorFields: any[]) => {
    const first = errorFields?.[0]?.name?.[0];
    if (!first) return 0;
    for (const [stepIdxStr, fields] of Object.entries(stepFields)) {
      if (fields.includes(first)) return Number(stepIdxStr);
    }
    return 0;
  };

  // ---------- MEDIA helpers (Primary duy nhất) ----------
  const mediaWatch: Media[] = Form.useWatch('media', form) || [];

  // đặt ảnh index là primary, các ảnh khác tắt
  const makePrimary = (idx: number) => {
    const currentMedia: Media[] = form.getFieldValue('media') || [];
    const next = currentMedia.map((m, i) => ({ ...m, is_primary: i === idx }));
    form.setFieldsValue({ media: next });
  };

  // ---------- Custom checks khi Submit ----------
  function checkCustom(values: FormValues) {
    const skus = (values.variants || []).map((v) => v.sku).filter(Boolean);
    const seen = new Set<string>();
    const dup = new Set<string>();
    skus.forEach((s) => (seen.has(s) ? dup.add(s) : seen.add(s)));
    if (dup.size)
      return {
        ok: false as const,
        step: 2,
        msg: `SKU trùng lặp: ${Array.from(dup).join(', ')}`,
      };

    for (const inv of values.inventory || []) {
      if (!inv.variant_sku)
        return {
          ok: false as const,
          step: 3,
          msg: 'Mỗi dòng tồn kho phải có Variant SKU',
        };
      if (!values.variants?.some((v) => v.sku === inv.variant_sku))
        return {
          ok: false as const,
          step: 3,
          msg: `SKU tồn kho không khớp: ${inv.variant_sku}`,
        };
    }
    return { ok: true as const };
  }

  async function handleCreate() {
    try {
      setSubmitting(true);
      const values = await form.validateFields();

      // Kiểm tra custom: SKU trùng, inventory hợp lệ
      const c = checkCustom(values);
      if (!c.ok) {
        setCurrent(c.step);
        message.error(c.msg);
        return;
      }

      // Tính stock từ inventory
      const updatedVariants = (values.variants || []).map((v: Variant) => {
        const total = (values.inventory || [])
          .filter((inv: Inventory) => inv.variant_sku === v.sku)
          .reduce(
            (s: number, inv: Inventory) => s + (Number(inv.quantity) || 0),
            0
          );
        return { ...v, stock: total };
      });

      // Payload cho API
      const payload: CreateProductDto = {
        name: String(values.name),
        description: values.description || '',
        base_price: values.base_price ?? 0,
        brandId: Number(values.brandId ),
        categories: values.categories?.map(Number),
        media: values.media?.map((m) => ({
          media_type: m.media_type,
          url: m.url,
          is_primary: m.is_primary || false,
        })),
        variants: updatedVariants,
        inventory: values.inventory?.map((inv) => ({
          variant_sku: inv.variant_sku,
          location: inv.location,
          quantity: inv.quantity,
          used_quantity: inv.used_quantity || 0,
        })),
        pricing_rules: values.pricing_rules?.map((pr) => ({
          type: pr.type,
          min_quantity: pr.min_quantity,
          price: pr.price,
          cycle: pr.cycle,
          starts_at: pr.starts_at
            ? (pr.starts_at as any).format?.('YYYY-MM-DD')
            : undefined,
          ends_at: pr.ends_at
            ? (pr.ends_at as any).format?.('YYYY-MM-DD')
            : undefined,
        })),
      };

      // Gọi API
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3000/products/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create product');

      message.success('Tạo sản phẩm thành công');
      onCreated?.();
      onClose?.();
    } catch (err: any) {
      if (err?.errorFields?.length) {
        setCurrent(findStepByError(err.errorFields));
        message.error('Vui lòng điền đủ thông tin bắt buộc.');
      } else {
        message.error(err?.message || 'Không thể tạo sản phẩm');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const values = Form.useWatch([], form) || {};

  return (
    <div>
      <Steps
        current={current}
        onChange={onStepClick}
        items={steps.map((s) => ({ title: s.title }))}
        style={{ marginBottom: 16 }}
      />

      <Form<FormValues>
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
        {/* BƯỚC 0: Thông tin */}
        {current === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label="Tên sản phẩm"
              rules={[
                { required: true, message: 'Vui lòng nhập tên sản phẩm' },
              ]}
            >
              <Input placeholder="VD: Áo thun basic" />
            </Form.Item>

         <Form.Item
  name="brandId"
  label="Thương hiệu"
  rules={[{ required: true, message: 'Vui lòng chọn thương hiệu' }]}
>
  <Select placeholder="Chọn thương hiệu">
    {brands.map((b) => (
      <Option key={b.id} value={b.id}>
        {b.name}
      </Option>
    ))}
  </Select>
</Form.Item>



            <Form.Item name="short_description" label="Mô tả ngắn">
              <Input placeholder="Mô tả ngắn gọn" />
            </Form.Item>

            <Form.Item
              name="base_price"
              label="Giá cơ bản (₫)"
              rules={[{ required: true, message: 'Vui lòng nhập giá cơ bản' }]}
            >
              <InputNumber min={0} step={1000} className="w-full" />
            </Form.Item>

            <Form.Item
              className="md:col-span-2"
              name="categories"
              label="Danh mục"
            >
              <Select mode="multiple" placeholder="Chọn danh mục">
                {categories.map((c) => (
                  <Option key={c.id} value={c.id}>
                    {c.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              className="md:col-span-2"
              name="description"
              label="Mô tả"
            >
              <Input.TextArea rows={4} placeholder="Mô tả chi tiết sản phẩm" />
            </Form.Item>
          </div>
        )}

        {/* BƯỚC 1: Media — chỉ Primary (không có Thứ tự) */}
        {current === 1 && (
          <Form.List name="media">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card
                    key={key}
                    size="small"
                    className="mb-3"
                    title={`Media #${name + 1}`}
                    extra={
                      <Button
                        type="link"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      >
                        Xóa
                      </Button>
                    }
                  >
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_140px] items-center">
                      <Form.Item
                        {...rest}
                        name={[name, 'url']}
                        label="URL hình ảnh"
                        rules={[{ required: true, message: 'Nhập URL' }]}
                      >
                        <Input placeholder="https://..." />
                      </Form.Item>

                      <Form.Item
                        {...rest}
                        name={[name, 'is_primary']}
                        label="Primary"
                        valuePropName="checked"
                      >
                        <Switch
                          checked={!!mediaWatch?.[name]?.is_primary}
                          onChange={(checked) => {
                            if (checked) {
                              // ✅ bật Primary cho dòng hiện tại, các dòng khác tắt
                              makePrimary(name);
                            } else {
                              // cho phép không có primary nào
                              const cur: Media[] =
                                form.getFieldValue('media') || [];
                              cur[name] = { ...cur[name], is_primary: false };
                              form.setFieldsValue({ media: cur });
                            }
                          }}
                        />
                      </Form.Item>

                      {/* Không còn "Thứ tự" */}
                      <Form.Item
                        hidden
                        {...rest}
                        name={[name, 'media_type']}
                        initialValue="image"
                      >
                        <Input />
                      </Form.Item>
                    </div>
                  </Card>
                ))}

                <Button
                  icon={<PlusOutlined />}
                  onClick={() =>
                    add({
                      media_type: 'image',
                      url: '',
                      // nếu hiện chưa có ảnh primary nào -> ảnh mới sẽ là primary
                      is_primary: (mediaWatch || []).every(
                        (m: any) => !m?.is_primary
                      ),
                    })
                  }
                >
                  Thêm Media
                </Button>
              </>
            )}
          </Form.List>
        )}

        {/* BƯỚC 2: Biến thể */}
        {current === 2 && (
          <Form.List name="variants">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => {
                  const sku = form.getFieldValue(['variants', name, 'sku']);
                  const inv: Inventory[] =
                    form.getFieldValue('inventory') || [];
                  const total = inv
                    .filter((i) => i.variant_sku === sku)
                    .reduce((s, i) => s + (Number(i.quantity) || 0), 0);

                  return (
                    <Card
                      key={key}
                      size="small"
                      className="mb-3"
                      title={`Biến thể #${name + 1}`}
                      extra={
                        <Button
                          type="link"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        >
                          Xóa
                        </Button>
                      }
                    >
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <Form.Item
                          {...rest}
                          name={[name, 'sku']}
                          label="SKU"
                          rules={[{ required: true, message: 'Nhập SKU' }]}
                        >
                          <Input placeholder="SKU-001" />
                        </Form.Item>
                        <Form.Item
                          {...rest}
                          name={[name, 'variant_name']}
                          label="Tên biến thể"
                        >
                          <Input placeholder="Size M / Màu Đen..." />
                        </Form.Item>
                        <Form.Item
                          {...rest}
                          name={[name, 'price']}
                          label="Giá (₫)"
                          rules={[{ required: true, message: 'Nhập giá' }]}
                        >
                          <InputNumber min={0} step={1000} className="w-full" />
                        </Form.Item>
                        <Form.Item label="Tồn (auto)">
                          <InputNumber
                            disabled
                            value={total}
                            className="w-full"
                          />
                        </Form.Item>
                        <Form.Item
                          {...rest}
                          name={[name, 'barcode']}
                          label="Barcode"
                        >
                          <Input />
                        </Form.Item>
                      </div>
                    </Card>
                  );
                })}
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => add({ price: 0, stock: 0 })}
                >
                  Thêm biến thể
                </Button>
              </>
            )}
          </Form.List>
        )}

        {/* BƯỚC 3: Tồn kho */}
        {current === 3 && (
          <Form.List name="inventory">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card
                    key={key}
                    size="small"
                    className="mb-3"
                    title={`Kho #${name + 1}`}
                    extra={
                      <Button
                        type="link"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      >
                        Xóa
                      </Button>
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Form.Item
                        {...rest}
                        name={[name, 'variant_sku']}
                        label="Variant SKU"
                        rules={[
                          { required: true, message: 'Nhập Variant SKU' },
                        ]}
                      >
                        <Input placeholder="SKU-001" />
                      </Form.Item>
                      <Form.Item
                        {...rest}
                        name={[name, 'location']}
                        label="Vị trí kho"
                      >
                        <Input placeholder="Kho A / Kệ B1..." />
                      </Form.Item>
                      <Form.Item
                        {...rest}
                        name={[name, 'quantity']}
                        label="Số lượng"
                        rules={[{ required: true, message: 'Nhập số lượng' }]}
                      >
                        <InputNumber min={0} className="w-full" />
                      </Form.Item>
                    </div>
                  </Card>
                ))}
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => add({ quantity: 0 })}
                >
                  Thêm dòng tồn kho
                </Button>
              </>
            )}
          </Form.List>
        )}

        {/* BƯỚC 4: Pricing Rules */}
        {current === 4 && (
          <Form.List name="pricing_rules">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card
                    key={key}
                    size="small"
                    className="mb-3"
                    title={`Rule #${name + 1}`}
                    extra={
                      <Button
                        type="link"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => remove(name)}
                      >
                        Xóa
                      </Button>
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      <Form.Item {...rest} name={[name, 'type']} label="Loại">
                        <Input placeholder="bulk_discount / flash_sale..." />
                      </Form.Item>
                      <Form.Item
                        {...rest}
                        name={[name, 'min_quantity']}
                        label="Min Qty"
                      >
                        <InputNumber min={0} className="w-full" />
                      </Form.Item>
                      <Form.Item
                        {...rest}
                        name={[name, 'price']}
                        label="Giá (₫)"
                      >
                        <InputNumber min={0} step={1000} className="w-full" />
                      </Form.Item>
                      <Form.Item
                        {...rest}
                        name={[name, 'cycle']}
                        label="Chu kỳ"
                      >
                        <Input placeholder="daily / weekly..." />
                      </Form.Item>
                      <Form.Item
                        {...rest}
                        name={[name, 'starts_at']}
                        label="Bắt đầu"
                      >
                        <DatePicker className="w-full" />
                      </Form.Item>
                      <Form.Item
                        {...rest}
                        name={[name, 'ends_at']}
                        label="Kết thúc"
                      >
                        <DatePicker className="w-full" />
                      </Form.Item>
                    </div>
                  </Card>
                ))}
                <Button icon={<PlusOutlined />} onClick={() => add({})}>
                  Thêm pricing rule
                </Button>
              </>
            )}
          </Form.List>
        )}

        {/* BƯỚC 5: Review */}
        {current === 5 && (
          <div className="space-y-4">
            <Title level={5}>Xem lại</Title>
            <div>
              <Text strong>Tên:</Text> {values?.name || '—'}
            </div>
            <div>
              <Text strong>Brand:</Text>{' '}
              {brands.find((b) => b.id === values?.brandId)?.name || '—'}
            </div>
            <div>
              <Text strong>Giá cơ bản:</Text> {values?.base_price ?? 0}
            </div>
            <div>
              <Text strong>Danh mục:</Text>{' '}
              {(values?.categories || [])
                .map((id: number) => categories.find((c) => c.id === id)?.name)
                .filter(Boolean)
                .join(', ') || '—'}
            </div>
            <div>
              <Text strong>Media:</Text>{' '}
              {Array.isArray(values?.media) ? values.media.length : 0}
            </div>
            <div>
              <Text strong>Biến thể:</Text>{' '}
              {Array.isArray(values?.variants) ? values.variants.length : 0}
            </div>
            <div>
              <Text strong>Tồn kho:</Text>{' '}
              {Array.isArray(values?.inventory) ? values.inventory.length : 0}
            </div>
            <div>
              <Text strong>Pricing rules:</Text>{' '}
              {Array.isArray(values?.pricing_rules)
                ? values.pricing_rules.length
                : 0}
            </div>
          </div>
        )}
      </Form>

      <Divider />

      <div className="flex justify-between">
        <Space>
          <Button onClick={onClose}>Hủy</Button>
        </Space>
        <Space>
          {current > 0 && <Button onClick={goPrev}>Quay lại</Button>}
          {current < steps.length - 1 ? (
            <Button type="primary" onClick={goNext}>
              Tiếp tục
            </Button>
          ) : (
            <Button type="primary" loading={submitting} onClick={handleCreate}>
              Tạo sản phẩm
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
}
