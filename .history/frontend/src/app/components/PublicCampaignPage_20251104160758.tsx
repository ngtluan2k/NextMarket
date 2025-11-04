import React, { useEffect, useState } from 'react';
import { Spin, Card, Typography, Row, Col, Image, Tag, Button, message } from 'antd';
import {
  getPublicCampaignDetail,
  PublicCampaignDetail,
  RegisteredProduct,
} from '../../service/campaign.service';
import { TagOutlined, GiftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { userVoucherApi, voucherCollectionApi } from '../api/voucher.api'; 

interface Props {
  campaignId: number;
}

export default function PublicCampaignPage({ campaignId }: Props) {
  const [campaign, setCampaign] = useState<PublicCampaignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [collectableVouchers, setCollectableVouchers] = useState<Set<number>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    loadCampaignData();
  }, [campaignId]);

  const loadCampaignData = async () => {
    try {
      setLoading(true);
      const data = await getPublicCampaignDetail(campaignId);
      setCampaign(data);
      console.log('Campaign data:', data);

      // Load voucher có thể thu thập
      await loadCollectableVouchers(data.vouchers || []);

    } catch (err) {
      console.error('Error fetching campaign:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCollectableVouchers = async (campaignVouchers: any[]) => {
    const token = localStorage.getItem('token');
    if (!token) {
      // Nếu chưa login, tất cả voucher đều có thể thu thập
      const allVoucherIds = new Set(campaignVouchers.map(v => v.id));
      setCollectableVouchers(allVoucherIds);
      return;
    }

    try {
      // Chỉ lấy voucher CÓ THỂ THU THẬP (chưa thu thập)
      const availableVouchers = await userVoucherApi.getAvailableVouchersForCollection();
      const availableVoucherIds = new Set(availableVouchers.map(v => v.id));
      
      // Filter chỉ những voucher trong campaign mà user có thể thu thập
      const campaignVoucherIds = campaignVouchers.map(v => v.id);
      const collectableIds = campaignVoucherIds.filter(id => availableVoucherIds.has(id));
      
      setCollectableVouchers(new Set(collectableIds));
      
      console.log('📦 Collectable vouchers:', collectableIds.length);
    } catch (err) {
      console.error('Error loading collectable vouchers:', err);
      // Fallback: hiển thị tất cả voucher nếu có lỗi
      const allVoucherIds = new Set(campaignVouchers.map(v => v.id));
      setCollectableVouchers(allVoucherIds);
    }
  };

  const handleCollectVoucher = async (voucherId: number) => {
    const token = localStorage.getItem('token');
    if (!token) {
      message.warning('Vui lòng đăng nhập để thu thập voucher!');
      navigate('/login');
      return;
    }

    try {
      await userVoucherApi.collectVoucher(voucherId);
      message.success('Thu thập voucher thành công!');
      
      // Cập nhật UI: xóa voucher khỏi danh sách có thể thu thập
      setCollectableVouchers(prev => {
        const newSet = new Set(prev);
        newSet.delete(voucherId);
        return newSet;
      });
    } catch (err: any) {
      message.error('Lỗi khi thu thập voucher: ' + (err.message || 'Voucher không khả dụng'));
    }
  };

  // Tạo block xen kẽ: banner -> voucher -> store
  const renderBlocks = () => {
    const blocks: React.ReactNode[] = [];

    if (!campaign) return blocks;

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
            preview={false}
          />
        </div>
      );
    }

    // --- 2️⃣ Hàng voucher (CHỈ voucher có thể thu thập) ---
    const availableVouchers = campaign.vouchers?.filter(v => 
      collectableVouchers.has(v.id)
    ) || [];

    if (availableVouchers.length > 0) {
      blocks.push(
        <div key="vouchers-section">
          <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 16 }}>
            <GiftOutlined /> Voucher Có Thể Thu Thập
          </Typography.Title>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              marginBottom: 24,
              padding: 20,
              borderRadius: 8,
              width: '100%',
              justifyContent: 'center',
            }}
          >
            {availableVouchers.map((v) => (
              <Card
                key={`voucher-${v.id}`}
                size="default"
                hoverable
                style={{ 
                  minWidth: 250, 
                  flex: '0 0 auto',
                  border: '2px dashed #ff4d4f',
                  background: 'linear-gradient(135deg, #ff4d4f15, #ffffff)'
                }}
                cover={
                  <div style={{ 
                    background: '#ff4d4f', 
                    padding: '16px', 
                    textAlign: 'center',
                    color: 'white',
                    fontWeight: 'bold'
                  }}>
                    <TagOutlined style={{ fontSize: '24px', marginRight: 8 }} />
                    {Number(v.discount_value) % 1 === 0
                      ? `Giảm ${Number(v.discount_value).toLocaleString()}₫`
                      : `Giảm ${Number(v.discount_value)}%`}
                  </div>
                }
              >
                <Card.Meta
                  title={v.title}
                  description={
                    <div style={{ textAlign: 'center' }}>
                      <Button
                        type="primary"
                        block
                        style={{ marginTop: 12 }}
                        onClick={() => handleCollectVoucher(v.id)}
                        icon={<GiftOutlined />}
                      >
                        Thu thập ngay
                      </Button>
                    </div>
                  }
                />
              </Card>
            ))}
          </div>
        </div>
      );
    }

    // --- 3️⃣ Thông báo nếu không có voucher nào có thể thu thập ---
    if (availableVouchers.length === 0 && campaign.vouchers && campaign.vouchers.length > 0) {
      blocks.push(
        <Card key="no-vouchers" style={{ marginBottom: 24, textAlign: 'center' }}>
          <Typography.Text type="secondary">
            Bạn đã thu thập tất cả voucher trong chiến dịch này! 🎉
          </Typography.Text>
        </Card>
      );
    }

    // --- 4️⃣ Các cặp Banner + Products ---
    const nextBanners = campaign.images?.slice(1) || [];
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
              preview={false}
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
            <Typography.Title level={4}>{store.name}</Typography.Title>
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
                        style={{ height: 150, objectFit: 'cover' }}
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
                            <p style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
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

  if (loading) return <Spin tip="Đang tải chiến dịch..." />;
  if (!campaign) return <p>Không tìm thấy chiến dịch</p>;

  return (
    <div
      style={{
        backgroundColor: campaign.backgroundColor || '#ffffff',
        minHeight: '100vh',
        transition: 'background-color 0.3s ease',
      }}
    >
      <Navbar />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
        {renderBlocks()}
      </div>
    </div>
  );
}