// PublishCampaignForm.tsx
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
} from 'antd';
import { ArrowLeftOutlined, CheckOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getCampaignDetail, publishCampaign, RegisteredProduct } from '../../../../service/campaign.service';
import { voucherApi } from '../../.././api/voucher.api';
import type { Voucher } from '../../.././types/voucher';

const { Title } = Typography;
const { Option } = Select;

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
  stores: {
    id: number;
    name: string;
    products: RegisteredProduct[];
  }[];
}

export default function PublishCampaignForm({ campaignId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [campaignDetail, setCampaignDetail] = useState<CampaignDetail | null>(null);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [selectedVouchers, setSelectedVouchers] = useState<number[]>([]);
  const [bannerFiles, setBannerFiles] = useState<File[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getCampaignDetail(campaignId);
        setCampaignDetail(data);
        const vData = await voucherApi.getAvailableVoucherOfSystem();
        setVouchers(vData);
        console.log(vData)
      } catch (err) {
        console.error(err);
        message.error('Không tải được thông tin chiến dịch hoặc voucher');
      } finally {
        setLoading(false);
      }
    })();
  }, [campaignId]);

  const handlePublish = async () => {
    if (bannerFiles.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 banner cho chiến dịch');
      return;
    }

    setPublishing(true);
    try {
      // Chuyển vouchers sang DTO format
      const voucherPayload = selectedVouchers.map((vId) => ({ voucher_id: vId }));

      const imagesPayload = bannerFiles.map((file) => ({ file }));

      await publishCampaign({
        campaignId,
        images: imagesPayload,
        vouchers: voucherPayload.length > 0 ? voucherPayload : undefined,
      });

      message.success('🎉 Đã đăng chiến dịch thành công!');
      onClose();
    } catch (err) {
      console.error(err);
      message.error('Đăng chiến dịch thất bại');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) return <Spin tip="Đang tải thông tin..." />;

  // Merge tất cả products từ các store
  const allProducts: RegisteredProduct[] = [];
  campaignDetail?.stores.forEach((store) => {
    store.products?.forEach((prod) => {
      allProducts.push({
        ...prod,
        storeName: store.name,
      });
    });
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
    {
      title: 'Biến thể',
      key: 'variants',
      render: (_: any, record: any) =>
        record.variants?.length ? (
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {record.variants.map((v: any) => (
              <li key={v.id}>
                {v.variant_name} — {v.price.toLocaleString()} ₫
              </li>
            ))}
          </ul>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <Card>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onClose}>
          Quay lại
        </Button>
        <h2 style={{ margin: 0 }}>Đăng chiến dịch</h2>
      </Space>

      <Descriptions bordered column={1}>
        <Descriptions.Item label="Tên chiến dịch">{campaignDetail?.name}</Descriptions.Item>
        <Descriptions.Item label="Ngày bắt đầu">
          {campaignDetail?.starts_at
            ? dayjs(campaignDetail.starts_at).format('HH:mm, DD/MM/YYYY')
            : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Ngày kết thúc">
          {campaignDetail?.ends_at
            ? dayjs(campaignDetail.ends_at).format('HH:mm, DD/MM/YYYY')
            : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Mô tả">{campaignDetail?.description || '—'}</Descriptions.Item>

        <Descriptions.Item label="Chọn voucher">
          <Select
            mode="multiple"
            placeholder="Chọn voucher"
            style={{ width: '100%' }}
            value={selectedVouchers}
            onChange={setSelectedVouchers}
          >
            {vouchers.map((v) => (
              <Option key={v.id} value={v.id}>
                {v.title} ({v.discount_value}%)
              </Option>
            ))}
          </Select>
        </Descriptions.Item>

        <Descriptions.Item label="Banner">
          <Upload
            beforeUpload={(file) => {
              setBannerFiles((prev) => [...prev, file]);
              return false; // ngăn tự upload
            }}
            multiple
            fileList={bannerFiles.map((f) => ({
              uid: f.name,
              name: f.name,
              status: 'done',
            }))}
            onRemove={(file) =>
              setBannerFiles((prev) => prev.filter((f) => f.name !== file.name))
            }
          >
            <Button icon={<UploadOutlined />}>Chọn file banner</Button>
          </Upload>
        </Descriptions.Item>
      </Descriptions>

      <Title level={5} style={{ marginTop: 24 }}>
        🛒 Danh sách sản phẩm đăng ký
      </Title>
      <Table dataSource={allProducts} columns={columns} rowKey="id" pagination={false} />

      <div style={{ marginTop: 24, textAlign: 'right' }}>
        <Button
          type="primary"
          icon={<CheckOutlined />}
          loading={publishing}
          onClick={handlePublish}
        >
          Xác nhận đăng
        </Button>
      </div>
    </Card>
  );
}
