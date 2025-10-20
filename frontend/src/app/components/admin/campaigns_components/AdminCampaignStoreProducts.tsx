import React, { useEffect, useState } from 'react';
import { Card, Table, Spin, message } from 'antd';
import dayjs from 'dayjs';
import { getCampaignStoreDetail } from '../../../../service/campaign.service';

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

  useEffect(() => {
    (async () => {
      try {
        const res = await getCampaignStoreDetail(campaignId, storeId);
        // res.products là danh sách sản phẩm và variant đã đăng ký
        setProducts(res.products || []);
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
    <Card title="Sản phẩm đã đăng ký trong campaign">
      <Table
        dataSource={products}
        rowKey={(record) => record.product.id}
        columns={[
          {
            title: 'Tên sản phẩm',
            dataIndex: ['product', 'name'],
          },
          {
            title: 'Giá gốc',
            dataIndex: ['product', 'base_price'],
            render: (price: number) => price?.toLocaleString() + '₫',
          },
          {
            title: 'Variant',
            render: (_, record) => {
              const variants = record.product?.variants || [];
              if (variants.length === 0) return '-';
              return variants.map((v: any) => v.variant_name).join(', ');
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
  );
}
