import React, { useEffect, useState } from 'react';
import { Spin, Card, Typography, Row, Col, Image, Tag } from 'antd';
import {
  getPublicCampaignDetail,
  PublicCampaignDetail,
  RegisteredProduct,
} from '../../service/campaign.service';
import { TagOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar'; // 👈 Thêm dòng này

interface Props {
  campaignId: number;
}

export default function PublicCampaignPage({ campaignId }: Props) {
  const [campaign, setCampaign] = useState<PublicCampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getPublicCampaignDetail(campaignId);
        setCampaign(data);
        console.log(data);
      } catch (err) {
        console.error('Error fetching campaign:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [campaignId]);

  if (loading) return <Spin tip="Đang tải chiến dịch..." />;

  if (!campaign) return <p>Không tìm thấy chiến dịch</p>;

  // Tạo block xen kẽ: banner -> voucher -> store
  const renderBlocks = () => {
    const blocks: React.ReactNode[] = [];

    // --- 1️⃣ Banner đầu tiên ---
    if (campaign.images[0]) {
      const img = campaign.images[0];
      blocks.push(
        <div key={`banner-0`} style={{ marginBottom: 24 }}>
          <Image
            src={
              img.imageUrl.startsWith('http')
                ? img.imageUrl
                : `http://localhost:3000${img.imageUrl}`
            }
            alt="campaign banner"
            width="100%"
          />
        </div>
      );
    }

    // --- 2️⃣ Hàng voucher (tất cả voucher) ---
    if (campaign.vouchers.length > 0) {
      blocks.push(
        <div
          key="vouchers-row"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 16,
            marginBottom: 24,
            padding: 20,
            borderRadius: 8,
            width: '100%',
          }}
        >
          {campaign.vouchers.map((v) => (
            <Card
              key={`voucher-${v.id}`}
              size="default"
              hoverable
              style={{ minWidth: 220, flex: '0 0 auto' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 6,
                    background: '#ff6b6b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                  }}
                >
                  <TagOutlined />
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: 16 }}>
                    {v.title}
                  </div>
                  <div style={{ fontSize: 14, color: '#555' }}>
                    {Number(v.discount_value) % 1 === 0
                      ? `${Number(v.discount_value).toLocaleString()}₫`
                      : `${Number(v.discount_value)}%`}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    // --- 3️⃣ Các cặp Banner + Products ---
    // Bắt đầu từ banner thứ 2 (index 1)
    const nextBanners = campaign.images.slice(1);
    const stores = campaign.stores || [];

    for (let i = 0; i < Math.max(nextBanners.length, stores.length); i++) {
      // Banner kế tiếp
      if (nextBanners[i]) {
        const img = nextBanners[i];
        blocks.push(
          <div key={`banner-next-${i}`} style={{ marginBottom: 24 }}>
            <Image
              src={
                img.imageUrl.startsWith('http')
                  ? img.imageUrl
                  : `http://localhost:3000${img.imageUrl}`
              }
              alt="campaign banner"
              width="100%"
            />
          </div>
        );
      }

      // Store tương ứng (nếu có)
      if (stores[i]) {
        const store = stores[i];
        blocks.push(
          <div
            key={`store-${store.id}`}
            style={{ marginBottom: 24, padding: 20 }}
          >
            <Row gutter={[12, 12]}>
              {store.products?.map((p) => (
                <Col key={p.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    size="small"
                    hoverable
                    style={{ fontSize: 12 }}
                    onClick={() => navigate(`/products/slug/${p.slug}`)}
                    cover={
                      <img
                        alt={p.name}
                        src={
                          (p as any).imageUrl
                            ? (p as any).imageUrl.startsWith('http')
                              ? (p as any).imageUrl
                              : `http://localhost:3000${(p as any).imageUrl}`
                            : 'https://via.placeholder.com/150x150?text=No+Image'
                        }
                      />
                    }
                  >
                    <Card.Meta
                      title={p.name}
                      description={
                        <>
                          <p>
                            Giá gốc:{' '}
                            {p.base_price
                              ? `${Number(p.base_price).toLocaleString()} ₫`
                              : '—'}
                          </p>
                          {p.variant && (
                            <p>
                              Biến thể: {p.variant.variant_name} —{' '}
                              {p.variant.price
                                ? `${Number(
                                    p.variant.price
                                  ).toLocaleString()} ₫`
                                : '—'}
                            </p>
                          )}
                          {p.promo_price && (
                            <p>
                              Giá KM: {Number(p.promo_price).toLocaleString()} ₫
                            </p>
                          )}
                          <Tag
                            color={
                              p.status === 'approved'
                                ? 'green'
                                : p.status === 'pending'
                                ? 'orange'
                                : 'red'
                            }
                          >
                            {p.status.toUpperCase()}
                          </Tag>
                        </>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        );
      }
    }

    return blocks;
  };

  return (
    <div
      style={{
        backgroundColor: campaign.backgroundColor || '#ffffff', // 👈 dùng màu từ API
        minHeight: '100vh', // để nền phủ toàn trang
        transition: 'background-color 0.3s ease', // mượt hơn
      }}
    >
      <Navbar />
      {renderBlocks()}
    </div>
  );
}
