import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { message, Spin } from 'antd';
import AdminCampaignStoreProducts from './campaigns_components/AdminCampaignStoreProducts';
import { getCampaignStoreDetail } from '../../../service/campaign.service';

export default function AdminCampaignStoreProductsWrapper() {
  const { campaignId, storeId } = useParams<{ campaignId: string; storeId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!campaignId || !storeId) return;

    (async () => {
      setLoading(true);
      try {
        const res = await getCampaignStoreDetail(Number(campaignId), Number(storeId));
        setProducts(res.products || []);
      } catch (err) {
        console.error(err);
        message.error('Không lấy được danh sách sản phẩm');
      } finally {
        setLoading(false);
      }
    })();
  }, [campaignId, storeId]);

  if (!campaignId || !storeId) return <p>Thiếu thông tin campaign hoặc store</p>;
  if (loading) return <Spin tip="Đang tải..." />;

  return (
    <AdminCampaignStoreProducts
      campaignId={Number(campaignId)}
      storeId={Number(storeId)}
      onBack={() => navigate(-1)}
    />
  );
}