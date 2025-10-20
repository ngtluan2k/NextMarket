// src/components/store/StoreCampaignDetail.tsx
import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Tag,
  message,
  Checkbox,
  Spin,
  Typography,
  Space,
} from 'antd';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import {
  Campaign,
  getCampaignDetailForStore,
  registerStoreForCampaign,
  RegisteredProduct,
} from '../../../../service/campaign.service';
import { storeService } from '../../../../service/store.service';
import { productService, Product } from '../../../../service/product.service';

const { Title, Paragraph } = Typography;

interface Props {
  campaignId: number;
  onBack: () => void;
}

interface APIRegisteredProduct {
  id: number;
  promo_price: number | null;
  status: string;
  registeredAt: string;
  approvedAt?: string | null;
  product: { id: number; name: string; base_price: string | number };
  variant?: { id: number; variant_name: string; price: string | number };
}

const StoreCampaignDetail: React.FC<Props> = ({ campaignId, onBack }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<{
    [productId: number]: number[];
  }>({});
  const [registered, setRegistered] = useState(false);
  const [registeredProducts, setRegisteredProducts] = useState<
    RegisteredProduct[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const storeRes = await storeService.getMyStore();
        if (!storeRes) {
          message.error('Bạn chưa có cửa hàng');
          return;
        }
        setStoreId(storeRes.id);

        const { campaign: detailCampaign, registeredStore } =
          await getCampaignDetailForStore(campaignId); // ← dùng campaignId từ props
        setCampaign(detailCampaign);
        setRegistered(!!registeredStore);

        // Map registered products...
        const apiProducts =
          registeredStore?.products as unknown as APIRegisteredProduct[];
        const mappedProducts: RegisteredProduct[] = (apiProducts || []).map(
          (p) => ({
            id: p.product.id,
            name: p.product.name,
            base_price: p.product.base_price
              ? Number(p.product.base_price)
              : undefined,
            variants: p.variant
              ? [
                  {
                    id: p.variant.id,
                    variant_name: p.variant.variant_name,
                    price: Number(p.variant.price),
                  },
                ]
              : undefined,
          })
        );
        setRegisteredProducts(mappedProducts);

        // Lấy sản phẩm active của store
        const prods = await productService.getStoreProducts(storeRes.id);
        setProducts(prods.filter((p) => p.status === 'active'));
      } catch (err) {
        console.error(err);
        message.error('Không tải được thông tin chi tiết');
      } finally {
        setLoading(false);
      }
    })();
  }, [campaignId]);

  const handleRegister = async () => {
    if (!campaign || !storeId) return;

    const items: { productId: number; variantId?: number }[] = [];
    Object.entries(selectedVariants).forEach(([productIdStr, variantIds]) => {
      const productId = Number(productIdStr);
      if (variantIds.length === 0) return;

      const product = products.find((p) => p.id === productId);
      if (product?.variants && product.variants.length > 0) {
        variantIds.forEach((vid) => items.push({ productId, variantId: vid }));
      } else {
        items.push({ productId });
      }
    });

    if (items.length === 0) {
      message.warning('Vui lòng chọn ít nhất 1 sản phẩm hoặc variant');
      return;
    }

    try {
      await registerStoreForCampaign(campaign.id, items);
      message.success('Đăng ký thành công!');
      setRegistered(true);

      // Cập nhật UI sản phẩm đã đăng ký
      const updatedRegisteredProducts: RegisteredProduct[] = products
        .filter((p) => selectedVariants[p.id]?.length)
        .map((p) => ({
          id: p.id,
          name: p.name,
          base_price: p.base_price ? Number(p.base_price) : undefined,
          variants: p.variants
            ?.filter((v) => selectedVariants[p.id]?.includes(v.id))
            .map((v) => ({
              id: v.id,
              variant_name: v.variant_name,
              price: typeof v.price === 'string' ? Number(v.price) : v.price,
            })),
        }));
      setRegisteredProducts(updatedRegisteredProducts);
    } catch (err: any) {
      console.error(err);
      message.error(
        err.response?.data?.message || 'Không thể đăng ký chiến dịch'
      );
    }
  };

  if (loading) return <Spin tip="Đang tải..." />;
  if (!campaign) return <p>Không có dữ liệu</p>;

  const renderStatusTag = (status: string) => {
    switch (status) {
      case 'pending':
        return <Tag color="blue">Sắp diễn ra</Tag>;
      case 'active':
        return <Tag color="green">Đang diễn ra</Tag>;
      case 'ended':
        return <Tag color="red">Kết thúc</Tag>;
      default:
        return <Tag>Khác</Tag>;
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <Button onClick={onBack} style={{ marginBottom: 20 }}>
        ← Quay lại
      </Button>
<Card>
  {/* Banner */}
  {campaign.banner_url && (
    <div style={{ marginBottom: 20, textAlign: 'center' }}>
      <img
        src={`http://localhost:3000${campaign.banner_url}`}
        alt={campaign.name}
        style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }}
      />
    </div>
  )}

  <Title level={3}>{campaign.name}</Title>
  {renderStatusTag(campaign.status)}
  <Paragraph>{campaign.description || 'Không có mô tả'}</Paragraph>
  <p>
    <strong>Thời gian:</strong>{' '}
    {dayjs(campaign.starts_at).format('DD/MM/YYYY')} -{' '}
    {dayjs(campaign.ends_at).format('DD/MM/YYYY')}
  </p>
  <hr />
        

        {registered ? (
          <>
            <Title level={4} style={{ marginTop: 16 }}>
              Sản phẩm đã đăng ký
            </Title>
            {registeredProducts.length > 0 ? (
              <ul>
                {registeredProducts.map((p) => (
                  <li key={p.id}>
                    ✅ {p.name} —{' '}
                    {p.variants && p.variants.length > 0
                      ? p.variants.map((v) => v.variant_name).join(', ')
                      : p.base_price?.toLocaleString() + '₫'}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Không có sản phẩm đã đăng ký.</p>
            )}
          </>
        ) : (
          <>
            <Title level={4} style={{ marginTop: 16 }}>
              Chọn sản phẩm / variant để đăng ký
            </Title>
            {products.length === 0 ? (
              <p>Không có sản phẩm active trong cửa hàng.</p>
            ) : (
              <Space direction="vertical">
                {products.map((p) => (
                  <div key={p.id}>
                    <strong>{p.name}</strong>
                    {p.variants && p.variants.length > 0 ? (
                      <div style={{ paddingLeft: 20 }}>
                        {p.variants.map((v) => (
                          <Checkbox
                            key={v.id}
                            checked={selectedVariants[p.id]?.includes(v.id)}
                            onChange={(e) => {
                              setSelectedVariants((prev) => {
                                const selected = prev[p.id] || [];
                                if (e.target.checked)
                                  return {
                                    ...prev,
                                    [p.id]: [...selected, v.id],
                                  };
                                return {
                                  ...prev,
                                  [p.id]: selected.filter((id) => id !== v.id),
                                };
                              });
                            }}
                          >
                            {v.variant_name} — {v.price.toLocaleString()}₫
                          </Checkbox>
                        ))}
                      </div>
                    ) : (
                      <Checkbox
                        checked={selectedVariants[p.id]?.includes(0)}
                        onChange={(e) => {
                          setSelectedVariants((prev) => {
                            if (e.target.checked)
                              return { ...prev, [p.id]: [0] };
                            return { ...prev, [p.id]: [] };
                          });
                        }}
                      >
                        Giá: {p.base_price?.toLocaleString()}₫
                      </Checkbox>
                    )}
                  </div>
                ))}
              </Space>
            )}

            <Button
              type="primary"
              onClick={handleRegister}
              disabled={Object.values(selectedVariants).every(
                (arr) => arr.length === 0
              )}
              style={{ marginTop: 20 }}
            >
              Đăng ký tham gia
            </Button>
          </>
        )}
      </Card>
    </div>
  );
};

export default StoreCampaignDetail;
