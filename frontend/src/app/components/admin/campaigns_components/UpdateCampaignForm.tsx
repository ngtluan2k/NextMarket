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
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getCampaignDetail,
  updateCampaign,
  RegisteredProduct,
} from '../../../../service/campaign.service';
import { Voucher } from '../../../types/voucher';
import { voucherApi } from '../../../api/voucher.api';
import type { UploadFile } from 'antd/es/upload/interface';

interface ExtendedUploadFile extends UploadFile {
  id?: number;
}

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

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

export default function UpdateCampaignForm({ campaignId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaignDetail, setCampaignDetail] = useState<CampaignDetail | null>(
    null
  );
  const [selectedVouchers, setSelectedVouchers] = useState<number[]>([]);
  const [allVouchers, setAllVouchers] = useState<
    { id: number; title: string; discount_value: string }[]
  >([]);
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

  useEffect(() => {
    (async () => {
      try {
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
        // 🧩 Voucher có sẵn
        if (data.vouchers?.length) {
          setSelectedVouchers(
            data.vouchers.map(
              (v: { id: number; title: string; discount_value: string }) => v.id
            )
          );
        }

        // 🧩 Banner có sẵn
        if (data.images?.length) {
          setBannerFiles(
            data.images.map(
              (img: { id: number; imageUrl: string }, idx: number) => ({
                uid: String(idx),
                id: img.id,
                name: img.imageUrl.split('/').pop() || '',
                url: img.imageUrl.startsWith('http')
                  ? img.imageUrl
                  : `http://localhost:3000${img.imageUrl}`,
                status: 'done' as const,
              })
            )
          );
        }

        // 🧩 Lấy toàn bộ voucher trong hệ thống
        const vData = await voucherApi.getAllVouchers();

        // Nếu API trả về mảng có `uuid`, `title`, `discount_value` như bạn gửi ở trên
        // thì ta chỉ cần map lại cho gọn
        const mappedVouchers = vData.map((v: any) => ({
          id: v.id,
          title: v.title,
          discount_value: v.discount_value,
        }));

        setAllVouchers(mappedVouchers);
      } catch (err) {
        console.error(err);
        message.error('Không tải được thông tin chiến dịch hoặc voucher');
      } finally {
        setLoading(false);
      }
    })();
  }, [campaignId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const imagesPayload = bannerFiles.map((f) => ({
        file: f.originFileObj,
      }));
      const vouchersPayload = selectedVouchers.map((id) => ({
        voucher_id: id,
      }));

      await updateCampaign({
        campaignId,
        name: formValues.name,
        description: formValues.description,
        startsAt: formValues.startsAt.toISOString(),
        endsAt: formValues.endsAt.toISOString(),
        backgroundColor: formValues.backgroundColor,
        status: formValues.status,
        images: imagesPayload,
        vouchers: vouchersPayload.length ? vouchersPayload : undefined,
        removedImages, // 🆕 thêm danh sách ảnh bị xoá
      });

      message.success('✅ Cập nhật chiến dịch thành công!');
      onClose();
    } catch (err) {
      console.error(err);
      message.error('❌ Cập nhật chiến dịch thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spin tip="Đang tải thông tin..." />;

  // Merge tất cả products từ các store
  const allProducts: RegisteredProduct[] = [];
  campaignDetail?.stores.forEach((store) => {
    store.products?.forEach((prod) =>
      allProducts.push({ ...prod, storeName: store.name })
    );
  });

  const columns = [
    { title: 'Cửa hàng', dataIndex: 'storeName', key: 'storeName' },
    { title: 'Tên sản phẩm', dataIndex: 'name', key: 'name' },
    {
      title: 'Giá gốc',
      dataIndex: 'base_price',
      key: 'base_price',
      render: (price: number) => (price ? `${price.toLocaleString()} ₫` : '—'),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onClose}>
          Quay lại
        </Button>
        <h2 style={{ margin: 0 }}>Cập nhật chiến dịch</h2>
      </Space>

      <Descriptions bordered column={1}>
        <Descriptions.Item label="Tên chiến dịch">
          <Input
            value={formValues.name}
            onChange={(e) =>
              setFormValues({ ...formValues, name: e.target.value })
            }
          />
        </Descriptions.Item>

        <Descriptions.Item label="Mô tả">
          <TextArea
            rows={3}
            value={formValues.description}
            onChange={(e) =>
              setFormValues({ ...formValues, description: e.target.value })
            }
          />
        </Descriptions.Item>

        <Descriptions.Item label="Ngày bắt đầu">
          <DatePicker
            showTime
            value={formValues.startsAt}
            onChange={(val) => setFormValues({ ...formValues, startsAt: val! })}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Ngày kết thúc">
          <DatePicker
            showTime
            value={formValues.endsAt}
            onChange={(val) => setFormValues({ ...formValues, endsAt: val! })}
          />
        </Descriptions.Item>

        <Descriptions.Item label="Màu nền">
          <Input
            type="color"
            value={formValues.backgroundColor}
            onChange={(e) =>
              setFormValues({ ...formValues, backgroundColor: e.target.value })
            }
          />
        </Descriptions.Item>

        <Descriptions.Item label="Trạng thái">
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
        </Descriptions.Item>

        <Descriptions.Item label="Chọn voucher">
          <Select
            mode="multiple"
            placeholder="Chọn voucher"
            style={{ width: '100%' }}
            value={selectedVouchers}
            onChange={setSelectedVouchers}
            optionFilterProp="children"
            showSearch
          >
            {allVouchers.map((v) => (
              <Option key={v.id} value={v.id}>
                {v.title} ({parseFloat(v.discount_value)}%)
              </Option>
            ))}
          </Select>
        </Descriptions.Item>

        <Descriptions.Item label="Banner">
          <Upload
            multiple
            listType="picture"
            beforeUpload={(file) => {
              // không upload tự động, chỉ lưu vào state
              setBannerFiles((prev) => [
                ...prev,
                {
                  uid: file.uid,
                  name: file.name,
                  status: 'done',
                  url: URL.createObjectURL(file), // hiển thị preview
                  originFileObj: file, // để sau khi lưu còn lấy được file thực
                },
              ]);
              return false;
            }}
            fileList={bannerFiles.map((f) => ({
              uid: f.uid,
              name: f.name,
              status: f.status || 'done',
              url: f.url,
              id: f.id,
            }))}
            onRemove={(file) => {
              const f = file as ExtendedUploadFile;
              setBannerFiles((prev) => prev.filter((x) => x.uid !== f.uid));

              // ✅ chỉ thêm id khi có
              if (f.id !== undefined) {
                setRemovedImages((prev) => [...prev, f.id!]);
              }

              return true;
            }}
          >
            <Button icon={<UploadOutlined />}>Chọn file banner</Button>
          </Upload>
        </Descriptions.Item>
      </Descriptions>

      <Title level={5} style={{ marginTop: 24 }}>
        🛒 Danh sách sản phẩm đăng ký
      </Title>
      <Table
        dataSource={allProducts}
        columns={columns}
        rowKey="id"
        pagination={false}
      />

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
        >
          Lưu thay đổi
        </Button>
      </div>
    </Card>
  );
}
