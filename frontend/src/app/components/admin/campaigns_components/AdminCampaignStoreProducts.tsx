import React, { useEffect, useState } from 'react';
import { Card, Table, Spin, message, Button, Space } from 'antd';
import dayjs from 'dayjs';
import {
  getCampaignStoreDetail,
  CampaignStoreDetail,
} from '../../../../service/campaign.service';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

interface Props {
  campaignId: number;
  storeId: number;
  onBack: () => void;
}

export default function AdminCampaignStoreProducts({
  campaignId,
  storeId,
  onBack,
}: Props) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState<string>('');
  const navigate = useNavigate();

useEffect(() => {
  (async () => {
    try {
      const res = await getCampaignStoreDetail(campaignId, storeId); // 👈 THÊM DÒNG NÀY
      console.log('📦 API trả về:', res);

      const raw = res.products || [];

      const rows: any[] = [];
      const seen = new Set<string>();

      for (const rec of raw) {
        const product = rec.product || {};
        const productId = product.id ?? 0;

        if (rec.variant) {
          const variantId = rec.variant.id ?? 0;
          const key = `${productId}-${variantId}`;

          if (!seen.has(key)) {
            seen.add(key);
            rows.push({
              ...rec,
              product,
              variant: rec.variant,
            });
          }
          continue;
        }

        const variants = product.variants || [];
        if (variants.length === 0) {
          const key = `${productId}-0`;
          if (!seen.has(key)) {
            seen.add(key);
            rows.push({
              ...rec,
              product,
              variant: null,
            });
          }
        } else {
          for (const v of variants) {
            const variantId = v.id ?? 0;
            const key = `${productId}-${variantId}`;
            if (!seen.has(key)) {
              seen.add(key);
              rows.push({
                ...rec,
                product,
                variant: v,
              });
            }
          }
        }
      }

      setProducts(rows);
      setStoreName(res.storeName); // 👈 vẫn giữ dòng này

    } catch (err) {
      console.error(err);
      message.error('Không lấy được danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  })();
}, [campaignId, storeId]);


  if (loading) return <Spin tip="Đang tải..." />;

  return (
    <>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Quay lại
        </Button>
        <h2 style={{ margin: 0 }}>
          Sản phẩm đã đăng ký trong campaign của cửa hàng {storeName}
        </h2>
        <Button
          type="primary"
          onClick={() => navigate(`/admin/stores/${storeId}`)}
        >
          Xem cửa hàng
        </Button>
      </Space>
      <Card title="">
        <Table
          dataSource={products}
          // unique key gồm productId và variantId (variantId = 0 nếu không có variant)
          rowKey={(record) =>
            `${record.product?.id ?? '0'}-${record.variant?.id ?? 0}`
          }
          columns={[
            {
              title: 'Tên sản phẩm',
              dataIndex: ['product', 'name'],
              render: (name: string, record: any) => (
                // Hiện tên product (sẽ lặp nhiều lần nếu có nhiều variant)
                <span>{name}</span>
              ),
            },
            {
              title: 'Variant',
              render: (_: any, record: any) =>
                record.variant ? record.variant.variant_name : '-',
            },
            {
              title: 'Giá gốc',
              render: (_: any, record: any) => {
                // nếu có variant thì lấy giá variant, còn không lấy base_price
                const price =
                  record.variant?.price ?? record.product?.base_price ?? null;
                return price ? Number(price).toLocaleString() + '₫' : '-';
              },
            },
            {
              title: 'Giá khuyến mãi',
              dataIndex: 'promo_price',
              render: (p: number) => (p ? p.toLocaleString() + '₫' : '-'),
            },
            {
              title: 'Trạng thái',
              dataIndex: 'status',
            },
          ]}
          pagination={false}
        />
      </Card>
    </>
  );
}
