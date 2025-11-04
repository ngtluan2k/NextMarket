import React, { useEffect, useState } from 'react';
import {
  Card,
  Descriptions,
  Button,
  message,
  Spin,
  Space,
  Table,
  Typography,
  Select,
  Upload,
  Input,
  DatePicker,
  Modal,
  Form,
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  UploadOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getCampaignDetail,
  updateCampaign,
  RegisteredProduct,
} from '../../service/campaign.service';
import { Voucher, VoucherCollectionType } from '../types/voucher';
import { voucherApi } from '../api/voucher.api';
import type { UploadFile } from 'antd/es/upload/interface';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { confirm } = Modal;

interface ExtendedUploadFile extends UploadFile {
  id?: number;
}

interface Props {
  campaignId: number;
  onClose: () => void;
}

interface CampaignDetail {
  id: number;
  name: string;
  description?: string;
  starts_at: string;
  ends_at: string;
  banner_url?: string;
  backgroundColor?: string;
  status?: string;
  images?: { id: number; imageUrl: string }[];
  vouchers?: { id: number; title: string; discount_value: string }[];
  stores: {
    id: number;
    name: string;
    products: RegisteredProduct[];
  }[];
}

interface VoucherOption {
  id: number;
  title: string;
  discount_value: string;
  discount_type: string;
  collection_type: VoucherCollectionType;
  code: string;
}

export default function UpdateCampaignForm({ campaignId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaignDetail, setCampaignDetail] = useState<CampaignDetail | null>(null);
  const [selectedVouchers, setSelectedVouchers] = useState<number[]>([]);
  const [allVouchers, setAllVouchers] = useState<VoucherOption[]>([]);
  const [bannerFiles, setBannerFiles] = useState<ExtendedUploadFile[]>([]);
  const [removedImages, setRemovedImages] = useState<number[]>([]);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
    startsAt: dayjs(),
    endsAt: dayjs().add(1, 'day'),
    bannerUrl: '',
    backgroundColor: '#ffffff',
    status: 'draft',
  });
  const [form] = Form.useForm();

  useEffect(() => {
    loadCampaignData();
  }, [campaignId]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      
      // 🧩 Lấy chi tiết campaign
      const data = await getCampaignDetail(campaignId);
      setCampaignDetail(data);
      
      setFormValues({
        name: data.name || '',
        description: data.description || '',
        startsAt: dayjs(data.starts_at),
        endsAt: dayjs(data.ends_at),
        bannerUrl: data.banner_url || '',
        backgroundColor: data.backgroundColor || '#ffffff',
        status: data.status || 'draft',
      });

      // 🧩 Gán voucher đã có sẵn trong campaign
      if (data.vouchers?.length) {
        setSelectedVouchers(
          data.vouchers.map(v => v.id)
        );
      }

      // 🧩 Banner có sẵn
      if (data.images?.length) {
        setBannerFiles(
          data.images.map((img, idx) => ({
            uid: String(img.id || idx),
            id: img.id,
            name: img.imageUrl.split('/').pop() || `banner-${idx + 1}`,
            url: img.imageUrl.startsWith('http')
              ? img.imageUrl
              : `http://localhost:3000${img.imageUrl}`,
            status: 'done' as const,
          }))
        );
      }

      // 🧩 Lấy toàn bộ voucher trong hệ thống
      await loadAllVouchers();

    } catch (err) {
      console.error('Error loading campaign:', err);
      message.error('Không tải được thông tin chiến dịch');
    } finally {
      setLoading(false);
    }
  };

  const loadAllVouchers = async () => {
    try {
      const vData = await voucherApi.getAvailableVoucherOfSystem();
      
      const mappedVouchers = vData.map((v: any) => ({
        id: v.id,
        title: v.title,
        discount_value: v.discount_value,
        discount_type: v.discount_type,
        collection_type: v.collection_type,
        code: v.code,
      }));

      setAllVouchers(mappedVouchers);
    } catch (err) {
      console.error('Error loading vouchers:', err);
      message.error('Không tải được danh sách voucher');
    }
  };

  const getVoucherDisplayText = (voucher: VoucherOption) => {
    const discountText = voucher.discount_type === 'PERCENTAGE' 
      ? `${voucher.discount_value}%`
      : `${Number(voucher.discount_value).toLocaleString()}₫`;
    
    const typeText = voucher.collection_type === VoucherCollectionType.EVENT 
      ? ' (Sự kiện)' 
      : voucher.collection_type === VoucherCollectionType.MANUAL 
      ? ' (Thủ công)' 
      : ' (Tự động)';

    return `${voucher.title} - ${discountText}${typeText}`;
  };

  const showVoucherChangeConfirm = (newSelectedVouchers: number[]) => {
    const addedVouchers = newSelectedVouchers.filter(id => !selectedVouchers.includes(id));
    const removedVouchers = selectedVouchers.filter(id => !newSelectedVouchers.includes(id));

    if (addedVouchers.length > 0 || removedVouchers.length > 0) {
      confirm({
        title: 'Xác nhận thay đổi voucher',
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            {addedVouchers.length > 0 && (
              <div>
                <Text strong>Voucher sẽ được thêm:</Text>
                <ul>
                  {addedVouchers.map(id => {
                    const voucher = allVouchers.find(v => v.id === id);
                    return voucher ? <li key={id}>{getVoucherDisplayText(voucher)}</li> : null;
                  })}
                </ul>
              </div>
            )}
            {removedVouchers.length > 0 && (
              <div>
                <Text strong>Voucher sẽ bị xóa:</Text>
                <ul>
                  {removedVouchers.map(id => {
                    const voucher = allVouchers.find(v => v.id === id);
                    return voucher ? <li key={id}>{getVoucherDisplayText(voucher)}</li> : null;
                  })}
                </ul>
              </div>
            )}
            <Text type="warning">
              Lưu ý: Thay đổi này chỉ ảnh hưởng đến việc hiển thị voucher trong campaign, 
              không ảnh hưởng đến trạng thái thu thập của người dùng.
            </Text>
          </div>
        ),
        onOk() {
          setSelectedVouchers(newSelectedVouchers);
        },
        onCancel() {
          // Giữ nguyên selection cũ
        },
      });
    } else {
      setSelectedVouchers(newSelectedVouchers);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // 🧩 Chuẩn bị dữ liệu ảnh
      const imagesPayload = bannerFiles
        .filter(f => f.originFileObj)
        .map((f) => ({
          file: f.originFileObj,
        }));

      // 🧩 Chuẩn bị dữ liệu voucher - CHỈ LIÊN KẾT, KHÔNG UPDATE COLLECTION_TYPE
      const vouchersPayload = selectedVouchers.map((id) => ({
        voucher_id: id,
      }));

      // 🧩 Gọi API update campaign
      await updateCampaign({
        campaignId,
        name: formValues.name,
        description: formValues.description,
        startsAt: formValues.startsAt.toISOString(),
        endsAt: formValues.endsAt.toISOString(),
        backgroundColor: formValues.backgroundColor,
        status: formValues.status,
        images: imagesPayload.length ? imagesPayload : undefined,
        vouchers: vouchersPayload.length ? vouchersPayload : undefined,
        removedImages,
      });

      // ✅ QUAN TRỌNG: KHÔNG tự động update collection_type của voucher
      // Việc này để voucher giữ nguyên collection_type ban đầu
      // User vẫn cần phải bấm "Thu thập" mới có được voucher

      message.success('✅ Cập nhật chiến dịch thành công!');
      onClose();
      
    } catch (err) {
      console.error('Error updating campaign:', err);
      message.error('❌ Cập nhật chiến dịch thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleBannerUpload = (file: File) => {
    const newFile: ExtendedUploadFile = {
      uid: file.uid,
      name: file.name,
      status: 'done',
      url: URL.createObjectURL(file),
      originFileObj: file,
    };
    
    setBannerFiles(prev => [...prev, newFile]);
    return false;
  };

  const handleBannerRemove = (file: ExtendedUploadFile) => {
    setBannerFiles(prev => prev.filter(x => x.uid !== file.uid));

    if (file.id !== undefined) {
      setRemovedImages(prev => [...prev, file.id!]);
    }

    return true;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin tip="Đang tải thông tin chiến dịch..." size="large" />
      </div>
    );
  }

  // Merge tất cả products từ các store
  const allProducts: (RegisteredProduct & { storeName: string })[] = [];
  campaignDetail?.stores.forEach((store) => {
    store.products?.forEach((prod) =>
      allProducts.push({ ...prod, storeName: store.name })
    );
  });

  const productColumns = [
    { 
      title: 'Cửa hàng', 
      dataIndex: 'storeName', 
      key: 'storeName',
      width: 150,
    },
    { 
      title: 'Tên sản phẩm', 
      dataIndex: 'name', 
      key: 'name',
      ellipsis: true,
    },
    {
      title: 'Giá gốc',
      dataIndex: 'base_price',
      key: 'base_price',
      render: (price: number) => (price ? `${price.toLocaleString()} ₫` : '—'),
      width: 120,
    },
    {
      title: 'Giá khuyến mãi',
      dataIndex: 'promo_price',
      key: 'promo_price',
      render: (price: number) => (price ? `${price.toLocaleString()} ₫` : '—'),
      width: 120,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span style={{ 
          color: status === 'approved' ? 'green' : 
                 status === 'pending' ? 'orange' : 'red',
          fontWeight: 'bold'
        }}>
          {status?.toUpperCase()}
        </span>
      ),
      width: 100,
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onClose}>
          Quay lại
        </Button>
        <Title level={2} style={{ margin: 0 }}>Cập nhật chiến dịch</Title>
      </Space>

      <Form
        form={form}
        layout="vertical"
        initialValues={formValues}
        onFinish={handleSave}
      >
        <Descriptions bordered column={1} size="default">
          <Descriptions.Item label="Tên chiến dịch">
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên chiến dịch' }]}
            >
              <Input
                value={formValues.name}
                onChange={(e) =>
                  setFormValues({ ...formValues, name: e.target.value })
                }
                placeholder="Nhập tên chiến dịch"
              />
            </Form.Item>
          </Descriptions.Item>

          <Descriptions.Item label="Mô tả">
            <Form.Item name="description">
              <TextArea
                rows={3}
                value={formValues.description}
                onChange={(e) =>
                  setFormValues({ ...formValues, description: e.target.value })
                }
                placeholder="Mô tả chiến dịch (không bắt buộc)"
              />
            </Form.Item>
          </Descriptions.Item>

          <Descriptions.Item label="Thời gian diễn ra">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item
                name="startsAt"
                rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Ngày bắt đầu"
                  value={formValues.startsAt}
                  onChange={(val) => setFormValues({ ...formValues, startsAt: val! })}
                  style={{ width: '100%' }}
                />
              </Form.Item>
              <Form.Item
                name="endsAt"
                rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc' }]}
              >
                <DatePicker
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  placeholder="Ngày kết thúc"
                  value={formValues.endsAt}
                  onChange={(val) => setFormValues({ ...formValues, endsAt: val! })}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Space>
          </Descriptions.Item>

          <Descriptions.Item label="Màu nền">
            <Form.Item name="backgroundColor">
              <Input
                type="color"
                value={formValues.backgroundColor}
                onChange={(e) =>
                  setFormValues({ ...formValues, backgroundColor: e.target.value })
                }
                style={{ width: 80 }}
              />
            </Form.Item>
          </Descriptions.Item>

          <Descriptions.Item label="Trạng thái">
            <Form.Item name="status">
              <Select
                style={{ width: 200 }}
                value={formValues.status}
                onChange={(val) => setFormValues({ ...formValues, status: val })}
              >
                <Option value="draft">Nháp</Option>
                <Option value="pending">Sắp diễn ra</Option>
                <Option value="active">Đang diễn ra</Option>
                <Option value="ended">Đã kết thúc</Option>
              </Select>
            </Form.Item>
          </Descriptions.Item>

          <Descriptions.Item label="Chọn voucher hiển thị">
            <Form.Item name="vouchers">
              <Select
                mode="multiple"
                placeholder="Chọn voucher để hiển thị trong campaign"
                style={{ width: '100%' }}
                value={selectedVouchers}
                onChange={showVoucherChangeConfirm}
                optionFilterProp="children"
                showSearch
                filterOption={(input, option) =>
                  option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {allVouchers.map((v) => (
                  <Option key={v.id} value={v.id}>
                    {getVoucherDisplayText(v)}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Lưu ý: Voucher được chọn sẽ hiển thị trong campaign. Người dùng vẫn cần bấm "Thu thập" để sở hữu voucher.
            </Text>
          </Descriptions.Item>

          <Descriptions.Item label="Banner campaign">
            <Form.Item name="banners">
              <Upload
                multiple
                listType="picture-card"
                beforeUpload={handleBannerUpload}
                fileList={bannerFiles}
                onRemove={handleBannerRemove}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Tải lên banner</Button>
              </Upload>
            </Form.Item>
          </Descriptions.Item>
        </Descriptions>

        {allProducts.length > 0 && (
          <>
            <Title level={4} style={{ marginTop: 24, marginBottom: 16 }}>
              🛍️ Sản phẩm tham gia campaign ({allProducts.length} sản phẩm)
            </Title>
            <Table
              dataSource={allProducts}
              columns={productColumns}
              rowKey="id"
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} của ${total} sản phẩm`
              }}
              scroll={{ x: 800 }}
              size="middle"
            />
          </>
        )}

        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Button 
            onClick={onClose} 
            style={{ marginRight: 8 }}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            onClick={handleSave}
            size="large"
          >
            Lưu thay đổi
          </Button>
        </div>
      </Form>
    </Card>
  );
}