import React, { useEffect, useState } from 'react';
import { Spin, Card, Row, Col, Image, Tag, Button, message } from 'antd';
import {
  getPublicCampaignDetail,
  PublicCampaignDetail,
} from '../../service/campaign.service';
import { TagOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { userVoucherApi } from '../api/voucher.api';

interface Props {
  campaignId: number;
}

export default function PublicCampaignPage({ campaignId }: Props) {
  const [campaign, setCampaign] = useState<PublicCampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [collectedVouchers, setCollectedVouchers] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  // ===== FETCH DỮ LIỆU CHIẾN DỊCH =====
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // Lấy thông tin chiến dịch
        const data = await getPublicCampaignDetail(campaignId);
        setCampaign(data);

        const token = localStorage.getItem('token');
        if (token) {
          // Lấy danh sách voucher người dùng đã có
          const myVouchers = await userVoucherApi.getMyVouchers();
          const collectedIds = new Set(myVouchers.map((v) => v.id));

          // ✅ Tự động thu thập những voucher chưa có
          for (const voucher of data.vouchers) {
            if (!collectedIds.has(voucher.id)) {
              try {
                await userVoucherApi.collectVoucher(voucher.id);
                collectedIds.add(voucher.id);
                console.log(`✅ Auto collected voucher: ${voucher.title}`);
              } catch (err) {
                console.warn(`⚠️ Không thể thu thập voucher ${voucher.title}`, err);
              }
            }
          }

          setCollectedVouchers(collectedIds);
        }
      } catch (err) {
        console.error('Error fetching campaign:', err);
        message.error('Không thể tải chiến dịch.');
      } finally {
        setLoading(false);
      }
    })();
  }, [campaignId]);

  // ===== XỬ LÝ THU THẬP KHI CLICK =====
  const handleCollectVoucher = async (voucherId: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning('Vui lòng đăng nhập để thu thập voucher!');
      return;
    }

    try {
      await userVoucherApi.collectVoucher(voucherId);
      message.success('Thu thập voucher thành công!');
      setCollectedVouchers((prev) => new Set([...prev, voucherId]));
    } catch (err) {
      console.error(err);
      message.error('Không thể thu thập voucher.');
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: 'center', paddingTop: 80 }}>
        <Spin tip="Đang tải chiến dịch..." size="large" />
      </div>
    );

  if (!campaign) return <p>Không tìm thấy chiến dịch</p>;

  // ===== HIỂN THỊ GIAO DIỆN =====
  const renderBlocks = () => {
    const blocks: React.ReactNode[] = [];

    // Banner đầu tiên
    if (campaign.images[0]) {
      const img = campaign.images[0];
      blocks.push(
        <div key="banner-0" style={{ marginBottom: 24 }}>
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

    // Hàng voucher
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
            background: '#fafafa',
          }}
        >
          {campaign.vouchers.map((v) => (
            <Card
              key={`voucher-${v.id}`}
              size="default"
              hoverable
              style={{
                minWidth: 220,
                flex: '0 0 auto',
                border: '1px solid #f0f0f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}
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
                  <div style={{ fontWeight: 'bold', fontSize: 16 }}>{v.title}</div>
                  <div style={{ fontSize: 14, color: '#555' }}>
                    {v.discount_type === 'percent'
                      ? `${v.discount_value}%`
                      : `${Number(v.discount_value).toLocaleString()}₫`}
                  </div>
                </div>
              </div>

              {/* Nút Thu Thập */}
              <Button
                type="primary"
                block
                style={{ marginTop: 12 }}
                onClick={() => handleCollectVoucher(v.id)}
                disabled={collectedVouchers.has(v.id)}
              >
                {collectedVouchers.has(v.id) ? 'Đã thu thập' : 'Thu thập'}
              </Button>
            </Card>
          ))}
        </div>
      );
    }

    // Banner + store products
    const nextBanners = campaign.images.slice(1);
    const stores = campaign.stores || [];

    for (let i = 0; i < Math.max(nextBanners.length, stores.length); i++) {
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

      if (stores[i]) {
        const store = stores[i];
        blocks.push(
          <div key={`store-${store.id}`} style={{ marginBottom: 24, padding: 20 }}>
            <Row gutter={[12, 12]}>
              {store.products?.map((p) => (
                <Col key={p.id} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    size="small"
                    hoverable
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
                          {p.base_price && (
                            <p>
                              Giá gốc: {Number(p.base_price).toLocaleString()} ₫
                            </p>
                          )}
                          {p.variant && (
                            <p>
                              Biến thể: {p.variant.variant_name} —{' '}
                              {p.variant.price
                                ? `${Number(p.variant.price).toLocaleString()} ₫`
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
        backgroundColor: campaign.backgroundColor || '#ffffff',
        minHeight: '100vh',
        transition: 'background-color 0.3s ease',
      }}
    >
      <Navbar />
      <div style={{ padding: '0 16px' }}>{renderBlocks()}</div>
    </div>
  );
}
